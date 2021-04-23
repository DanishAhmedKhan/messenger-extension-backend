const Excel = require('exceljs');

export default async function exportTemplatesData(data = []) {
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet('Canned Responses');

  worksheet.columns = [
    {
      header: 'Template', key: 'template', width: 40, style: { font: { name: 'Calibri', size: 11 }, alignment: { wrapText: true } },
    },
    {
      header: 'Messages', key: 'messages', width: 100, style: { font: { name: 'Calibri', size: 11 }, alignment: { wrapText: true } },
    },
  ];

  data.forEach((template) => {
    const messages = (template.messages || []);
    messages.forEach((msg) => {
      msg = msg.replace(/&#39;/g, "'");
      msg = msg.replace(/<br>/g, '\n');
      worksheet.addRow({ template: template.name, messages: msg });
    });
    if (messages.length === 0) {
      worksheet.addRow({ template: template.name, messages: '' });
    }
    worksheet.addRow();
  });

  worksheet.getCell('A1').font = { name: 'Calibri', bold: true, size: 12 };
  worksheet.getCell('B1').font = { name: 'Calibri', bold: true, size: 12 };
  // console.log('File is written');
  return workbook;
  // await workbook.xlsx.writeFile('kevin_dang21@yahoo.ca.xlsx');
}
