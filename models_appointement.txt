from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, time, timedelta
import uuid


class TimeStampedModel(models.Model):
    """Abstract base class with created_at and updated_at fields"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class Doctor(TimeStampedModel):
    """Doctor model with professional information"""
    SPECIALTIES = [
        ('cardiology', 'Cardiology'),
        ('dermatology', 'Dermatology'),
        ('endocrinology', 'Endocrinology'),
        ('gastroenterology', 'Gastroenterology'),
        ('neurology', 'Neurology'),
        ('orthopedics', 'Orthopedics'),
        ('pediatrics', 'Pediatrics'),
        ('psychiatry', 'Psychiatry'),
        ('pulmonology', 'Pulmonology'),
        ('general', 'General Medicine'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    specialty = models.CharField(max_length=20, choices=SPECIALTIES)
    license_number = models.CharField(max_length=20, unique=True)
    years_experience = models.PositiveIntegerField(validators=[MinValueValidator(0), MaxValueValidator(50)])
    phone_regex = RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")
    phone = models.CharField(validators=[phone_regex], max_length=17)
    email = models.EmailField()
    bio = models.TextField(blank=True, null=True)
    consultation_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'doctors'
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"Dr. {self.first_name} {self.last_name} - {self.get_specialty_display()}"
    
    @property
    def full_name(self):
        return f"Dr. {self.first_name} {self.last_name}"
    
    def get_availability_for_date(self, date, location):
        """Get available time slots for a specific date and location"""
        day_of_week = date.weekday()  # Monday = 0, Sunday = 6
        django_day = (day_of_week + 1) % 7  # Convert to Django format (Sunday = 0)
        
        # Get regular availability
        availability = self.availabilities.filter(
            location=location,
            day_of_week=django_day,
            is_available=True,
            effective_date__lte=date,
            expiry_date__gte=date
        ).first()
        
        if not availability:
            return []
        
        # Check for exceptions
        exception = self.schedule_exceptions.filter(
            location=location,
            exception_date=date
        ).first()
        
        if exception and exception.type == 'unavailable':
            return []
        
        # Generate time slots (30-minute intervals)
        slots = []
        current_time = availability.start_time
        end_time = exception.end_time if exception and exception.type == 'special_hours' else availability.end_time
        
        while current_time < end_time:
            # Check if slot is not already booked
            if not self.appointments.filter(
                location=location,
                appointment_date=date,
                appointment_time=current_time,
                status__in=['scheduled', 'confirmed']
            ).exists():
                slots.append(current_time)
            
            # Add 30 minutes
            current_time = (datetime.combine(date, current_time) + timedelta(minutes=30)).time()
        
        return slots


class Location(TimeStampedModel):
    """Hospital or Cabinet location model"""
    LOCATION_TYPES = [
        ('hospital', 'Hospital'),
        ('cabinet', 'Cabinet'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=LOCATION_TYPES)
    address = models.TextField()
    city = models.CharField(max_length=50)
    postal_code = models.CharField(max_length=10)
    phone_regex = RegexValidator(regex=r'^\+?1?\d{9,15}$')
    phone = models.CharField(validators=[phone_regex], max_length=17)
    email = models.EmailField()
    operating_hours_start = models.TimeField(default=time(8, 0))
    operating_hours_end = models.TimeField(default=time(18, 0))
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'locations'
        ordering = ['type', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
    
    def clean(self):
        if self.operating_hours_start >= self.operating_hours_end:
            raise ValidationError("Opening time must be before closing time")


class Patient(TimeStampedModel):
    """Patient model"""
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile', null=True, blank=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    phone_regex = RegexValidator(regex=r'^\+?1?\d{9,15}$')
    phone = models.CharField(validators=[phone_regex], max_length=17)
    email = models.EmailField()
    address = models.TextField()
    emergency_contact_name = models.CharField(max_length=100)
    emergency_contact_phone = models.CharField(validators=[phone_regex], max_length=17)
    medical_history = models.TextField(blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'patients'
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def age(self):
        today = timezone.now().date()
        return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))


class DoctorLocation(TimeStampedModel):
    """Many-to-many relationship between Doctor and Location"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='doctor_locations')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='location_doctors')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'doctor_locations'
        unique_together = ['doctor', 'location']
    
    def __str__(self):
        return f"{self.doctor.full_name} at {self.location.name}"
    
    def clean(self):
        if self.end_date and self.start_date >= self.end_date:
            raise ValidationError("Start date must be before end date")


class DoctorAvailability(TimeStampedModel):
    """Doctor's weekly availability schedule at specific locations"""
    DAYS_OF_WEEK = [
        (0, 'Sunday'),
        (1, 'Monday'),
        (2, 'Tuesday'),
        (3, 'Wednesday'),
        (4, 'Thursday'),
        (5, 'Friday'),
        (6, 'Saturday'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='availabilities')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='doctor_availabilities')
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    effective_date = models.DateField(default=timezone.now)
    expiry_date = models.DateField(default=lambda: timezone.now().date() + timedelta(days=365))
    
    class Meta:
        db_table = 'doctor_availability'
        unique_together = ['doctor', 'location', 'day_of_week', 'effective_date']
        ordering = ['day_of_week', 'start_time']
    
    def __str__(self):
        return f"{self.doctor.full_name} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time} at {self.location.name}"
    
    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("Start time must be before end time")
        if self.effective_date >= self.expiry_date:
            raise ValidationError("Effective date must be before expiry date")


class DoctorScheduleException(TimeStampedModel):
    """Exceptions to regular doctor availability (holidays, sick days, special hours)"""
    EXCEPTION_TYPES = [
        ('unavailable', 'Unavailable'),
        ('special_hours', 'Special Hours'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='schedule_exceptions')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='doctor_exceptions')
    exception_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    type = models.CharField(max_length=15, choices=EXCEPTION_TYPES)
    reason = models.CharField(max_length=200)
    
    class Meta:
        db_table = 'doctor_schedule_exceptions'
        unique_together = ['doctor', 'location', 'exception_date']
    
    def __str__(self):
        return f"{self.doctor.full_name} - {self.get_type_display()} on {self.exception_date}"
    
    def clean(self):
        if self.type == 'special_hours':
            if not self.start_time or not self.end_time:
                raise ValidationError("Special hours must have start and end times")
            if self.start_time >= self.end_time:
                raise ValidationError("Start time must be before end time")


class Appointment(TimeStampedModel):
    """Appointment model linking patient, doctor, and location"""
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='appointments')
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    duration_minutes = models.PositiveIntegerField(default=30, validators=[MinValueValidator(15), MaxValueValidator(240)])
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='scheduled')
    reason_for_visit = models.TextField()
    notes = models.TextField(blank=True, null=True)
    patient_notes = models.TextField(blank=True, null=True, help_text="Notes from patient")
    doctor_notes = models.TextField(blank=True, null=True, help_text="Notes from doctor")
    fee_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    is_paid = models.BooleanField(default=False)
    reminder_sent = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'appointments'
        unique_together = ['doctor', 'appointment_date', 'appointment_time']
        ordering = ['-appointment_date', '-appointment_time']
    
    def __str__(self):
        return f"{self.patient.full_name} with {self.doctor.full_name} on {self.appointment_date} at {self.appointment_time}"
    
    @property
    def appointment_datetime(self):
        return timezone.make_aware(datetime.combine(self.appointment_date, self.appointment_time))
    
    @property
    def can_be_cancelled(self):
        """Check if appointment can be cancelled (at least 24 hours before)"""
        return self.appointment_datetime > timezone.now() + timedelta(hours=24)
    
    def clean(self):
        # Validate appointment is in the future
        appointment_dt = datetime.combine(self.appointment_date, self.appointment_time)
        if appointment_dt <= datetime.now():
            raise ValidationError("Appointment must be scheduled for a future date and time")
        
        # Validate doctor is available at this location
        if not DoctorLocation.objects.filter(
            doctor=self.doctor,
            location=self.location,
            is_active=True,
            start_date__lte=self.appointment_date,
            end_date__gte=self.appointment_date
        ).exists():
            raise ValidationError("Doctor is not available at this location")
        
        # Check for conflicting appointments
        if Appointment.objects.filter(
            doctor=self.doctor,
            appointment_date=self.appointment_date,
            appointment_time=self.appointment_time,
            status__in=['scheduled', 'confirmed']
        ).exclude(id=self.id).exists():
            raise ValidationError("Doctor already has an appointment at this time")
    
    def save(self, *args, **kwargs):
        # Set fee amount from doctor's consultation fee if not set
        if not self.fee_amount:
            self.fee_amount = self.doctor.consultation_fee
        super().save(*args, **kwargs)


class AppointmentHistory(TimeStampedModel):
    """Track changes to appointments"""
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='history')
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    old_status = models.CharField(max_length=15)
    new_status = models.CharField(max_length=15)
    change_reason = models.TextField()
    
    class Meta:
        db_table = 'appointment_history'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.appointment} - {self.old_status} to {self.new_status}"