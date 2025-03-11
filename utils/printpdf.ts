import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface BillDetail {
  prise_encharge_name: string;
  quantite: number;
  prix_unitaire: string;
  montant_total: string;
}

interface Bill {
  reference: string;
  patient_name: string;
  date_facture: string;
  montant_total: string;
  statut_paiement: string;
  create_at: string;
}

export const generateBillPDF = (bill: Bill, details: BillDetail[]) => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(18);
  doc.text("Clinique XYZ", 20, 20);
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Facture: ${bill.reference}`, 20, 30);
  doc.text(`Date: ${new Date(bill.date_facture).toLocaleDateString()}`, 20, 35);
  doc.text(`Patient: ${bill.patient_name}`, 20, 40);

  // Create table data
  const tableData = details.map(detail => [
    detail.prise_encharge_name,
    detail.quantite.toString(),
    detail.prix_unitaire,
    detail.montant_total
  ]);

  // Add total row
  tableData.push([
    'TOTAL',
    '',
    '',
    bill.montant_total
  ]);

  // Create table
  (doc as any).autoTable({
    startY: 45,
    head: [['Service', 'Quantité', 'Prix unitaire', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
  });

  return doc;
};

// Update the thermal print function
export const printThermal = (bill: Bill, details: BillDetail[]) => {
  let content = `
${'CLINIQUE XYZ'.padStart(30)}
${'Adresse: Rue Principale'.padStart(30)}
${'Tel: 01 23 45 67 89'.padStart(30)}

${bill.reference.padStart(30)}
Date: ${new Date(bill.date_facture).toLocaleDateString()}
Patient: ${bill.patient_name}

--------------------------------
Service          Qté   Prix  Total
--------------------------------
`;

  details.forEach(detail => {
    content += `
${detail.prise_encharge_name.padEnd(15)} 
${detail.quantite.toString().padStart(4)} 
${detail.prix_unitaire.padStart(6)} 
${detail.montant_total.padStart(6)}
`;
  });

  content += `
--------------------------------
Total: ${bill.montant_total.padStart(23)}
--------------------------------

Merci de votre visite !
`;

  return content;
};