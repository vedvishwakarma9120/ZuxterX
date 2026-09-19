import html2pdf from "html2pdf.js/dist/html2pdf.bundle";

export function downloadPDF(text, title) {
  const lines = text.split("\n");
  let html = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      html += "<br/>";
      continue;
    }
    if (/^\d+[\.\)]/.test(trimmed)) {
      html += `<p style="font-weight:900;font-size:16px;color:#000;margin:16px 0 6px;text-align:left;"><strong>${trimmed}</strong></p>`;
    } else if (/^[A-Z][^a-z]{0,5}:/.test(trimmed) || (trimmed.endsWith(":") && trimmed.length < 60)) {
      html += `<p style="font-weight:800;font-size:14px;margin:12px 0 4px;text-align:left;"><strong>${trimmed}</strong></p>`;
    } else if (/^[-•*]/.test(trimmed)) {
      html += `<p style="margin:4px 0 4px 18px;text-align:left;">${trimmed}</p>`;
    } else {
      html += `<p style="margin:5px 0;text-align:left;">${trimmed}</p>`;
    }
  }

  const el = document.createElement("div");
  el.innerHTML = `
    <div style="position:relative;font-family:Arial,sans-serif;padding:30px 36px;color:#000;line-height:1.7;text-align:left;">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:60px;color:rgba(0,0,0,0.04);font-weight:900;pointer-events:none;white-space:nowrap;">ZuxterX</div>
      <div style="position:absolute;top:15px;right:25px;font-size:14px;font-weight:700;color:#000;">ZuxterX</div>
      <h2 style="text-align:left;margin-bottom:25px;font-size:24px;font-weight:900;color:#000;border-bottom:2px solid #000;padding-bottom:10px;">${title}</h2>
      ${html}
    </div>`;

  html2pdf().set({
    margin: [10, 10, 10, 10],
    filename: "zuxter-output.pdf",
    image: { type: "jpeg", quality: 1 },
    html2canvas: { scale: 3, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  }).from(el).save();
}
