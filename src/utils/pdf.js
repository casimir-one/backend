import puppeteer from 'puppeteer';

const generatePdf = async (htmlContent) => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();

  await page.setContent(htmlContent);

  const pdf = await page.pdf({
    format: 'a4',
    margin: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    }
  });

  await browser.close();

  return pdf;
};

export {
  generatePdf
};
