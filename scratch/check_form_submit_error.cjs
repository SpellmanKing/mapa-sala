const { spawn } = require('child_process');
const http = require('http');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// Start Chrome
const chrome = spawn(CHROME_PATH, [
  '--headless',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--user-data-dir=C:\\Users\\calebe.carvalho\\chrome-debug-profile'
]);

function getDebugUrl() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const poll = () => {
      attempts++;
      http.get('http://127.0.0.1:9222/json/list', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const targets = JSON.parse(data);
            const pageTarget = targets.find(t => t.type === 'page');
            if (pageTarget && pageTarget.webSocketDebuggerUrl) {
              resolve(pageTarget.webSocketDebuggerUrl);
            } else {
              if (attempts < 15) setTimeout(poll, 500);
              else reject(new Error("No page target found."));
            }
          } catch (e) {
            if (attempts < 15) setTimeout(poll, 500);
            else reject(e);
          }
        });
      }).on('error', (err) => {
        if (attempts < 15) setTimeout(poll, 500);
        else reject(err);
      });
    };
    poll();
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    const wsUrl = await getDebugUrl();
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: "Runtime.enable" }));
      ws.send(JSON.stringify({ id: 2, method: "Console.enable" }));
      ws.send(JSON.stringify({ id: 3, method: "Log.enable" }));
      ws.send(JSON.stringify({ id: 4, method: "Network.enable" }));
      ws.send(JSON.stringify({ id: 5, method: "Page.navigate", params: { url: "http://localhost:5173/painel" } }));
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      if (msg.method === "Console.messageAdded") {
        console.log(`[CONSOLE ${msg.params.message.level.toUpperCase()}]: ${msg.params.message.text}`);
      }
      if (msg.method === "Log.entryAdded") {
        console.log(`[LOG ${msg.params.entry.level.toUpperCase()}]: ${msg.params.entry.text}`);
      }
      if (msg.method === "Network.responseReceived") {
        const response = msg.params.response;
        if (response.status >= 400) {
          console.log(`[NETWORK ERROR ${response.status}]: ${response.url}`);
        }
      }
      if (msg.method === "Runtime.exceptionThrown") {
        const details = msg.params.exceptionDetails;
        const desc = details.exception ? details.exception.description : "No description";
        console.error(`\n!!! UNCAUGHT EXCEPTION: ${details.text} - ${desc}\n`);
      }

      if (msg.id === 5) {
        await delay(4000);
        console.log("Opening alocar modal...");
        ws.send(JSON.stringify({
          id: 10,
          method: "Runtime.evaluate",
          params: {
            expression: `
              (() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(b => b.textContent && b.textContent.includes('Alocar Turma'));
                if (btn) {
                  btn.click();
                  return "Alocar modal opened";
                }
                return "Alocar button not found";
              })()
            `,
            awaitPromise: true
          }
        }));
      }

      if (msg.id === 10) {
        console.log(msg.result?.result?.value);
        await delay(1000);
        console.log("Filling form and submitting...");
        ws.send(JSON.stringify({
          id: 20,
          method: "Runtime.evaluate",
          params: {
            expression: `
              (async () => {
                const selects = document.querySelectorAll('select');
                if (selects.length < 2) return "Not enough select fields";

                // Select course
                const courseSelect = selects[0];
                if (courseSelect.options.length < 2) return "No courses options";
                
                // Let's print out what courses are available
                console.log("Available courses options: " + Array.from(courseSelect.options).map(o => o.text).join(", "));
                
                courseSelect.value = courseSelect.options[1].value;
                courseSelect.dispatchEvent(new Event('change', { bubbles: true }));
                
                await new Promise(r => setTimeout(r, 500));
                
                // Select Sala 2 (to make a successful allocation or see if it fails)
                const roomSelect = document.querySelectorAll('select')[1];
                const optSala2 = Array.from(roomSelect.options).find(o => o.textContent.includes('Sala 2'));
                if (optSala2) {
                  roomSelect.value = optSala2.value;
                  roomSelect.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                  return "Sala 2 option not found";
                }

                // Set date to 2026-06-15
                const dateInput = document.querySelector('input[type="date"]');
                if (!dateInput) return "Date input not found";
                dateInput.value = '2026-06-15';
                dateInput.dispatchEvent(new Event('input', { bubbles: true }));

                // Set turno to Manhã
                const turnoSelect = document.querySelectorAll('select')[2];
                if (turnoSelect) {
                  const optManha = Array.from(turnoSelect.options).find(o => o.textContent.includes('Manhã'));
                  if (optManha) {
                    turnoSelect.value = optManha.value;
                    turnoSelect.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                }

                await new Promise(r => setTimeout(r, 500));

                const form = document.querySelector('form');
                if (form) {
                  const btnSubmit = form.querySelector('button[type="submit"]');
                  if (btnSubmit) {
                    btnSubmit.click();
                    return "Form submitted";
                  }
                }
                return "Submit button not found";
              })()
            `,
            awaitPromise: true
          }
        }));
      }

      if (msg.id === 20) {
        console.log("Submit result:", msg.result?.result?.value);
        await delay(3000);
        console.log("Checking result toast...");
        ws.send(JSON.stringify({
          id: 30,
          method: "Runtime.evaluate",
          params: {
            expression: `
              (() => {
                const divs = Array.from(document.querySelectorAll('div'));
                const toast = divs.find(d => 
                  d.className && 
                  d.className.includes('fixed') && 
                  d.className.includes('top-6') && 
                  d.className.includes('right-6')
                );
                
                if (toast) {
                  return {
                    found: true,
                    text: toast.textContent.trim()
                  };
                }
                return { found: false };
              })()
            `,
            returnByValue: true
          }
        }));
      }

      if (msg.id === 30) {
        console.log("Toast check:", msg.result?.result?.value);
        ws.close();
        chrome.kill();
        process.exit(0);
      }
    };

  } catch (err) {
    console.error("Error:", err.message);
    chrome.kill();
    process.exit(1);
  }
}

main();
