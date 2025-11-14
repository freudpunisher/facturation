### views.py
```python
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from django.db import transaction

from .models import (
    InsuranceCommand, Tarif, InsuranceDuration,
    PuissanceRange, Vehicle
)
from .serializers import (
    InsuranceCommandSerializer, CalculatePriceSerializer,
    InsuranceDurationSerializer
)


class InsuranceCommandViewSet(viewsets.ViewSet):
    """
    Custom endpoints matching your controller logic:
    - POST    /api/insurance-commands/             → create()
    - POST    /api/insurance-commands/calculate/   → calculate_price()
    - GET     /api/insurance-commands/durations/   → get_durations()
    - GET     /api/insurance-commands/user-commands/?user_id= → user_commands()
    - GET     /api/insurance-commands/             → list()
    - GET     /api/insurance-commands/{pk}/        → retrieve()
    - DELETE  /api/insurance-commands/{pk}/        → destroy()
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def create(self, request):
        # Validate required fields
        data = request.data
        for field in ['company_id', 'vehicle_id', 'duration_id', 'start_date']:
            if field not in data:
                raise ValidationError({field: 'This field is required.'})

        # Derive from vehicle
        vehicle = Vehicle.objects.get(pk=data['vehicle_id'])
        usage_id = vehicle.usage_id
        puissance_id = vehicle.puissance_id
        passenger_count = vehicle.passagers

        # Tarif lookup
        tarif = self._find_matching_tarif(
            usage_id, puissance_id, passenger_count,
            nombre_sur_plateau=vehicle.nombre_sur_plateau
        )
        if not tarif:
            return Response({'status': 'error', 'message': 'No matching tarif found for the given criteria'}, status=404)

        # Duration
        duration = InsuranceDuration.objects.get(pk=data['duration_id'])

        # Price calculations
        base_price = tarif.PN + tarif.frais
        total_base = self._calc_total_price(base_price, duration)
        tva = total_base * 0.18
        total_price = round(total_base + tva)

        # End date
        start_dt = timezone.make_aware(timezone.datetime.fromisoformat(data['start_date']))
        end_date = start_dt + relativedelta(months=duration.months)

        # Create record
        command = InsuranceCommand.objects.create(
            user_id=vehicle.created_by,
            company_id=data['company_id'],
            vehicle_id=vehicle.id,
            usage_id=usage_id,
            puissance_id=puissance_id,
            passenger_count=passenger_count,
            tarif_id=tarif.id,
            duration_id=duration.id,
            start_date=data['start_date'],
            end_date=end_date,
            base_price=base_price,
            total_price=total_price,
            payment_status='pending',
            status='active',
        )
        serializer = InsuranceCommandSerializer(command)
        return Response({'status': 'success', 'data': serializer.data}, status=201)

    @action(detail=False, methods=['post'], url_path='calculate')
    def calculate_price(self, request):
        # Price only, no persistence
        serializer = CalculatePriceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        tarif = self._find_matching_tarif(
            data['usage_id'], data.get('puissance_id'),
            data.get('passenger_count'), data.get('nombre_sur_plateau')
        )
        if not tarif:
            return Response({'status': 'error', 'message': 'No matching tarif found for the given criteria'}, status=404)

        duration = InsuranceDuration.objects.get(pk=data['duration_id'])
        base_price = tarif.PN + tarif.frais
        total_base = self._calc_total_price(base_price, duration)
        tva = total_base * 0.18
        return Response({
            'status': 'success',
            'data': {
                'base_price': base_price,
                'duration': duration.name,
                'coefficient': duration.coefficient,
                'tva': int(tva),
                'total_price': round(total_base + tva),
                'tarif_details': {'PN': tarif.PN}
            }
        })

    @action(detail=False, methods=['get'], url_path='durations')
    def get_durations(self, request):
        durations = InsuranceDuration.objects.filter(is_active=True)
        data = InsuranceDurationSerializer(durations, many=True).data
        return Response({'status': 'success', 'data': data})

    @action(detail=False, methods=['get'], url_path='user-commands')
    def user_commands(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            raise ValidationError('`user_id` query param required')
        cmds = InsuranceCommand.objects.filter(user_id=user_id, deleted_at__isnull=True).order_by('-created_at')
        data = InsuranceCommandSerializer(cmds, many=True).data
        return Response({'status': 'success', 'data': data})

    def list(self, request):
        qs = InsuranceCommand.objects.filter(deleted_at__isnull=True)
        data = InsuranceCommandSerializer(qs, many=True).data
        return Response({'status': 'success', 'data': data})

    def retrieve(self, request, pk=None):
        cmd = InsuranceCommand.objects.get(pk=pk, deleted_at__isnull=True)
        data = InsuranceCommandSerializer(cmd).data
        return Response({'status': 'success', 'data': data})

    def destroy(self, request, pk=None):
        cmd = InsuranceCommand.objects.get(pk=pk)
        cmd.deleted_at = timezone.now()
        cmd.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _find_matching_tarif(self, usage_id, puissance_id=None, passenger_count=None, nombre_sur_plateau=None):
        q = PuissanceRange.objects.filter(usage_id=usage_id)
        if passenger_count:
            q = q.filter(min_passager__lte=passenger_count, max_passager__gte=passenger_count)
        else:
            q = q.filter(min_passager__in=[None,0], max_passager__in=[None,0])
        if puissance_id:
            q = q.filter(puissance_id=puissance_id)
        if nombre_sur_plateau:
            q = q.filter(nbre_sur_plateau=nombre_sur_plateau)
        pr = q.first()
        return Tarif.objects.filter(puissance_range=pr).first() if pr else None

    def _calc_total_price(self, base_price, duration):
        months = duration.months
        coeff = duration.coefficient
        if months == 3:
            return base_price * coeff / 4
        if months == 6:
            return base_price * coeff / 2
        return base_price * coeff
```

### urls.py
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InsuranceCommandViewSet

router = DefaultRouter()
router.register(r'insurance-commands', InsuranceCommandViewSet, basename='insurancecommand')

urlpatterns = [
    path('api/', include(router.urls)),
]
```

**Accessible endpoints:**

| Method | URL                                            | Action             |
|--------|------------------------------------------------|--------------------|
| POST   | `/api/insurance-commands/`                     | create command     |
| POST   | `/api/insurance-commands/calculate/`           | calculate price    |
| GET    | `/api/insurance-commands/durations/`           | list durations     |
| GET    | `/api/insurance-commands/user-commands/?user_id=<id>` | user’s commands    |
| GET    | `/api/insurance-commands/`                     | list commands      |
| GET    | `/api/insurance-commands/{pk}/`                | retrieve command   |
| DELETE | `/api/insurance-commands/{pk}/`                | soft-delete command|
```
