const http = require('http');

const data = JSON.stringify({
  name: "Test User",
  citizenship: "Azerbaijan",
  targetCountry: "Germany",
  major: "Computer Science",
  gpa: "85",
  education: "Bachelor",
  institution: "Test Uni",
  englishLevel: "B2",
  eduLang: "English",
  language: "en"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`StatusCode: ${res.statusCode}`);
  
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
