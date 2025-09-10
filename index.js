const fs = require('fs');
const express = require('express');
const wiegine = require('fca-mafiya');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration and session storage
const sessions = new Map();
let wss;

// HTML Control Panel with improved logging
const htmlControlPanel = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💌 Stable Message Sender Bot</title>
    <style>
        :root {
            --color1: #FF9EC5;
            --color2: #9ED2FF;
            --color3: #FFFFFF;
            --color4: #FFB6D9;
            --text-dark: #333333;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, var(--color1) 0%, var(--color2) 100%);
            color: var(--text-dark);
            line-height: 1.6;
        }
        
        .header {
            text-align: center;
            margin-bottom: 25px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .panel {
            background: rgba(255, 255, 255, 0.9);
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            margin-bottom: 25px;
            backdrop-filter: blur(5px);
        }
        
        button {
            padding: 12px 20px;
            margin: 8px;
            cursor: pointer;
            background: linear-gradient(135deg, var(--color2) 0%, var(--color1) 100%);
            color: var(--text-dark);
            border: none;
            border-radius: 8px;
            transition: all 0.3s;
            font-weight: bold;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        button:disabled {
            background: #cccccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        input, select, textarea {
            padding: 12px 15px;
            margin: 8px 0;
            width: 100%;
            border: 2px solid var(--color2);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.8);
            color: var(--text-dark);
            font-size: 16px;
            transition: all 0.3s;
            box-sizing: border-box;
        }
        
        .log {
            height: 300px;
            overflow-y: auto;
            border: 2px solid var(--color2);
            padding: 15px;
            margin-top: 20px;
            font-family: 'Courier New', monospace;
            background: rgba(0, 0, 0, 0.9);
            color: #ffffff;
            border-radius: 10px;
            box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        
        .log-success {
            color: #4CAF50;
        }
        
        .log-error {
            color: #f44336;
        }
        
        .log-warning {
            color: #ff9800;
        }
        
        .log-info {
            color: #2196F3;
        }
        
        small {
            color: #666;
            font-size: 13px;
        }
        
        h1, h2, h3 {
            color: var(--text-dark);
            margin-top: 0;
        }
        
        .session-info {
            background: linear-gradient(135deg, var(--color2) 0%, var(--color1) 100%);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 15px;
            color: var(--text-dark);
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-box {
            background: linear-gradient(135deg, var(--color2) 0%, var(--color1) 100%);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            color: var(--text-dark);
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        }
        
        .cookie-status {
            margin-top: 15px;
            padding: 12px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.8);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .cookie-active {
            border-left: 5px solid #4CAF50;
        }
        
        .cookie-inactive {
            border-left: 5px solid #f44336;
        }
        
        .heart {
            color: var(--color4);
            margin: 0 5px;
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            color: var(--text-dark);
            font-size: 14px;
        }
        
        .session-manager {
            margin-top: 20px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 10px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, var(--color1) 0%, var(--color2) 100%);
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1><span class="heart">💌</span> Stable Message Sender Bot <span class="heart">💌</span></h1>
        <p>Send messages automatically - No auto disconnections or logouts</p>
    </div>
    
    <div class="panel">
        <div>
            <textarea id="cookie-text" placeholder="Paste your cookies here (one cookie per line)" rows="5"></textarea>
            <small>Paste your cookies directly (one cookie per line)</small>
        </div>
        
        <div>
            <input type="text" id="thread-id" placeholder="Thread/Group ID">
            <small>Enter the Facebook Group/Thread ID where messages will be sent</small>
        </div>
        
        <div>
            <input type="number" id="delay" value="5" min="1" placeholder="Delay in seconds">
            <small>Delay between messages (in seconds)</small>
        </div>
        
        <div>
            <input type="text" id="prefix" placeholder="Message Prefix (Optional)">
            <small>Optional prefix to add before each message</small>
        </div>
        
        <div>
            <textarea id="message-text" placeholder="Enter messages here (one message per line)" rows="5"></textarea>
            <small>Enter messages to send (one per line)</small>
        </div>
        
        <div style="text-align: center;">
            <button id="start-btn">Start Sending <span class="heart">💌</span></button>
            <button id="stop-btn" disabled>Stop Sending <span class="heart">💔</span></button>
        </div>
        
        <div id="session-info" style="display: none;" class="session-info">
            <h3>Your Session ID: <span id="session-id-display"></span></h3>
            <p>Save this ID to stop your session later or view its details</p>
        </div>
    </div>
    
    <div class="panel session-manager">
        <h3><span class="heart">🔍</span> Session Manager</h3>
        <p>Enter your Session ID to manage your running session</p>
        
        <input type="text" id="manage-session-id" placeholder="Enter your Session ID">
        
        <div style="text-align: center; margin-top: 15px;">
            <button id="view-session-btn">View Session Details</button>
            <button id="stop-session-btn">Stop Session</button>
        </div>
        
        <div id="session-details" style="display: none; margin-top: 20px;">
            <h4>Session Details</h4>
            <div class="stats">
                <div class="stat-box">
                    <div>Status</div>
                    <div id="detail-status">-</div>
                </div>
                <div class="stat-box">
                    <div>Total Messages Sent</div>
                    <div id="detail-total-sent">-</div>
                </div>
                <div class="stat-box">
                    <div>Current Loop Count</div>
                    <div id="detail-loop-count">-</div>
                </div>
                <div class="stat-box">
                    <div>Started At</div>
                    <div id="detail-started">-</div>
                </div>
            </div>
            
            <h4>Session Logs</h4>
            <div class="log" id="detail-log-container"></div>
        </div>
    </div>
    
    <div class="panel">
        <h3><span class="heart">📊</span> Active Session Statistics</h3>
        <div class="stats" id="stats-container">
            <div class="stat-box">
                <div>Status</div>
                <div id="stat-status">Not Started</div>
            </div>
            <div class="stat-box">
                <div>Total Messages Sent</div>
                <div id="stat-total-sent">0</div>
            </div>
            <div class="stat-box">
                <div>Current Loop Count</div>
                <div id="stat-loop-count">0</div>
            </div>
            <div class="stat-box">
                <div>Started At</div>
                <div id="stat-started">-</div>
            </div>
        </div>
        
        <h3><span class="heart">📝</span> Live Message Logs</h3>
        <div class="log" id="log-container"></div>
    </div>

    <div class="footer">
        <p>Made with <span class="heart">💌</span> | Stable messaging without auto-disconnections</p>
    </div>

    <script>
        const logContainer = document.getElementById('log-container');
        const startBtn = document.getElementById('start-btn');
        const stopBtn = document.getElementById('stop-btn');
        const cookieTextInput = document.getElementById('cookie-text');
        const threadIdInput = document.getElementById('thread-id');
        const delayInput = document.getElementById('delay');
        const prefixInput = document.getElementById('prefix');
        const messageTextInput = document.getElementById('message-text');
        const sessionInfoDiv = document.getElementById('session-info');
        const sessionIdDisplay = document.getElementById('session-id-display');
        
        // Session manager elements
        const manageSessionIdInput = document.getElementById('manage-session-id');
        const viewSessionBtn = document.getElementById('view-session-btn');
        const stopSessionBtn = document.getElementById('stop-session-btn');
        const sessionDetailsDiv = document.getElementById('session-details');
        const detailStatus = document.getElementById('detail-status');
        const detailTotalSent = document.getElementById('detail-total-sent');
        const detailLoopCount = document.getElementById('detail-loop-count');
        const detailStarted = document.getElementById('detail-started');
        const detailLogContainer = document.getElementById('detail-log-container');
        
        // Stats elements
        const statStatus = document.getElementById('stat-status');
        const statTotalSent = document.getElementById('stat-total-sent');
        const statLoopCount = document.getElementById('stat-loop-count');
        const statStarted = document.getElementById('stat-started');
        
        let currentSessionId = null;
        let socket = null;
        let sessionLogs = new Map();

        function addLog(message, type = 'info', sessionId = null) {
            const timestamp = new Date().toLocaleString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                hour12: true,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            const logEntry = document.createElement('div');
            logEntry.innerHTML = \`[\${timestamp}] \${message}\`;
            logEntry.className = \`log-\${type}\`;
            
            if (sessionId) {
                if (!sessionLogs.has(sessionId)) {
                    sessionLogs.set(sessionId, []);
                }
                sessionLogs.get(sessionId).push({message, type, timestamp});
                
                if (manageSessionIdInput.value === sessionId) {
                    detailLogContainer.appendChild(logEntry.cloneNode(true));
                    detailLogContainer.scrollTop = detailLogContainer.scrollHeight;
                }
            } else {
                logContainer.appendChild(logEntry);
                logContainer.scrollTop = logContainer.scrollHeight;
            }
        }
        
        function updateStats(data, sessionId = null) {
            if (sessionId && manageSessionIdInput.value === sessionId) {
                if (data.status) detailStatus.textContent = data.status;
                if (data.totalSent !== undefined) detailTotalSent.textContent = data.totalSent;
                if (data.loopCount !== undefined) detailLoopCount.textContent = data.loopCount;
                if (data.started) detailStarted.textContent = data.started;
            }
            
            if (!sessionId || sessionId === currentSessionId) {
                if (data.status) statStatus.textContent = data.status;
                if (data.totalSent !== undefined) statTotalSent.textContent = data.totalSent;
                if (data.loopCount !== undefined) statLoopCount.textContent = data.loopCount;
                if (data.started) statStarted.textContent = data.started;
            }
        }

        function connectWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            socket = new WebSocket(protocol + '//' + window.location.host);

            socket.onopen = () => {
                addLog('Bot service connected successfully', 'success');
            };
            
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'log') {
                        addLog(data.message, data.level || 'info', data.sessionId);
                    } 
                    else if (data.type === 'status') {
                        startBtn.disabled = data.running;
                        stopBtn.disabled = !data.running;
                    }
                    else if (data.type === 'session') {
                        currentSessionId = data.sessionId;
                        sessionIdDisplay.textContent = data.sessionId;
                        sessionInfoDiv.style.display = 'block';
                        addLog(\`Session started with ID: \${data.sessionId}\`, 'success');
                        localStorage.setItem('lastSessionId', data.sessionId);
                    }
                    else if (data.type === 'stats') {
                        updateStats(data, data.sessionId);
                    }
                    else if (data.type === 'session_details') {
                        detailStatus.textContent = data.status;
                        detailTotalSent.textContent = data.totalSent;
                        detailLoopCount.textContent = data.loopCount;
                        detailStarted.textContent = data.started;
                        sessionDetailsDiv.style.display = 'block';
                        
                        if (sessionLogs.has(data.sessionId)) {
                            const logs = sessionLogs.get(data.sessionId);
                            detailLogContainer.innerHTML = '';
                            logs.forEach(log => {
                                const logEntry = document.createElement('div');
                                logEntry.innerHTML = \`[\${log.timestamp}] \${log.message}\`;
                                logEntry.className = \`log-\${log.type}\`;
                                detailLogContainer.appendChild(logEntry);
                            });
                            detailLogContainer.scrollTop = detailLogContainer.scrollHeight;
                        }
                    }
                } catch (e) {
                    console.error('Error processing message:', e);
                }
            };
            
            socket.onclose = () => {
                addLog('Connection closed. Refresh page to reconnect.', 'warning');
            };
            
            socket.onerror = (error) => {
                addLog(\`Connection error: \${error.message || 'Unknown error'}\`, 'error');
            };
        }

        // Initial connection
        connectWebSocket();

        startBtn.addEventListener('click', () => {
            const cookiesContent = cookieTextInput.value.trim();
            if (!cookiesContent) {
                addLog('Please provide cookie content', 'error');
                return;
            }
            
            if (!threadIdInput.value.trim()) {
                addLog('Please enter a Thread/Group ID', 'error');
                return;
            }
            
            const messageContent = messageTextInput.value.trim();
            if (!messageContent) {
                addLog('Please enter messages to send', 'error');
                return;
            }
            
            const threadID = threadIdInput.value.trim();
            const delay = parseInt(delayInput.value) || 5;
            const prefix = prefixInput.value.trim();
            
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'start',
                    cookiesContent,
                    messageContent,
                    threadID,
                    delay,
                    prefix
                }));
            } else {
                addLog('Connection not ready. Please refresh the page.', 'error');
            }
        });
        
        stopBtn.addEventListener('click', () => {
            if (currentSessionId) {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ 
                        type: 'stop', 
                        sessionId: currentSessionId 
                    }));
                } else {
                    addLog('Connection not ready', 'error');
                }
            } else {
                addLog('No active session to stop', 'error');
            }
        });
        
        viewSessionBtn.addEventListener('click', () => {
            const sessionId = manageSessionIdInput.value.trim();
            if (sessionId) {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ 
                        type: 'view_session', 
                        sessionId: sessionId 
                    }));
                } else {
                    addLog('Connection not ready', 'error');
                }
            } else {
                addLog('Please enter a session ID', 'error');
            }
        });
        
        stopSessionBtn.addEventListener('click', () => {
            const sessionId = manageSessionIdInput.value.trim();
            if (sessionId) {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ 
                        type: 'stop', 
                        sessionId: sessionId 
                    }));
                    addLog(\`Stop command sent for session: \${sessionId}\`, 'success');
                } else {
                    addLog('Connection not ready', 'error');
                }
            } else {
                addLog('Please enter a session ID', 'error');
            }
        });
        
        // Check if we have a previous session ID
        window.addEventListener('load', () => {
            const lastSessionId = localStorage.getItem('lastSessionId');
            if (lastSessionId) {
                manageSessionIdInput.value = lastSessionId;
                addLog(\`Found your previous session ID: \${lastSessionId}\`, 'info');
            }
        });
        
        addLog('Bot control panel ready. Configure settings and start sending.', 'info');
    </script>
</body>
</html>
`;

// Start message sending function
function startSending(ws, cookiesContent, messageContent, threadID, delay, prefix) {
  const sessionId = uuidv4();
  
  // Parse cookies
  const cookies = cookiesContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map((cookie, index) => ({
      id: index + 1,
      content: cookie,
      active: false,
      sentCount: 0,
      api: null
    }));
  
  if (cookies.length === 0) {
    sendToClient(ws, { type: 'log', message: 'No valid cookies found', level: 'error' });
    return;
  }
  
  // Parse messages
  const messages = messageContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  if (messages.length === 0) {
    sendToClient(ws, { type: 'log', message: 'No messages found', level: 'error' });
    return;
  }

  // Create session object
  const session = {
    id: sessionId,
    threadID: threadID,
    messages: messages,
    cookies: cookies,
    currentCookieIndex: 0,
    currentMessageIndex: 0,
    totalMessagesSent: 0,
    loopCount: 0,
    delay: delay,
    prefix: prefix,
    running: true,
    startTime: new Date(),
    lastActivity: Date.now()
  };
  
  // Store session
  sessions.set(sessionId, session);
  
  // Send session ID to client
  sendToClient(ws, { type: 'session', sessionId: sessionId });
  sendToClient(ws, { type: 'log', message: `Session started with ID: ${sessionId}`, level: 'success', sessionId });
  sendToClient(ws, { type: 'log', message: `Loaded ${cookies.length} cookies`, level: 'success', sessionId });
  sendToClient(ws, { type: 'log', message: `Loaded ${messages.length} messages`, level: 'success', sessionId });
  sendToClient(ws, { type: 'status', running: true });
  
  // Update stats
  updateSessionStats(sessionId, ws);
  
  // Initialize all cookies
  initializeCookies(sessionId, ws);
}

// Initialize cookies
function initializeCookies(sessionId, ws) {
  const session = sessions.get(sessionId);
  if (!session || !session.running) return;
  
  let initializedCount = 0;
  
  session.cookies.forEach((cookie, index) => {
    // Add timeout to prevent hanging
    const loginTimeout = setTimeout(() => {
      if (!cookie.active) {
        sendToClient(ws, { 
          type: 'log', 
          message: `Cookie ${index + 1} login timeout`,
          level: 'error',
          sessionId
        });
        cookie.active = false;
        initializedCount++;
        checkAllCookiesInitialized(sessionId, ws, initializedCount, session.cookies.length);
      }
    }, 30000); // 30 second timeout
    
    wiegine.login(cookie.content, {}, (err, api) => {
      clearTimeout(loginTimeout);
      
      if (err || !api) {
        sendToClient(ws, { 
          type: 'log', 
          message: `Cookie ${index + 1} login failed: ${err?.message || err}`,
          level: 'error',
          sessionId
        });
        cookie.active = false;
      } else {
        cookie.api = api;
        cookie.active = true;
        sendToClient(ws, { 
          type: 'log', 
          message: `Cookie ${index + 1} logged in successfully`,
          level: 'success',
          sessionId
        });
      }
      
      initializedCount++;
      checkAllCookiesInitialized(sessionId, ws, initializedCount, session.cookies.length);
    });
  });
}

function checkAllCookiesInitialized(sessionId, ws, initializedCount, totalCookies) {
  if (initializedCount === totalCookies) {
    const session = sessions.get(sessionId);
    if (!session) return;
    
    const activeCookies = session.cookies.filter(c => c.active);
    if (activeCookies.length > 0) {
      sendToClient(ws, { 
        type: 'log', 
        message: `${activeCookies.length}/${session.cookies.length} cookies active, starting message sending`,
        level: 'success',
        sessionId
      });
      sendNextMessage(sessionId);
    } else {
      sendToClient(ws, { 
        type: 'log', 
        message: 'No active cookies, stopping session',
        level: 'error',
        sessionId
      });
      stopSending(sessionId);
    }
  }
}

// Send next message
function sendNextMessage(sessionId) {
  const session = sessions.get(sessionId);
  if (!session || !session.running) return;

  session.lastActivity = Date.now();

  const cookie = session.cookies[session.currentCookieIndex];
  const messageIndex = session.currentMessageIndex;
  const message = session.prefix 
    ? `${session.prefix} ${session.messages[messageIndex]}`
    : session.messages[messageIndex];
  
  if (!cookie.active || !cookie.api) {
    sendToSession(sessionId, { 
      type: 'log', 
      message: `Cookie ${session.currentCookieIndex + 1} is inactive, skipping`,
      level: 'warning'
    });
    moveToNextCookie(sessionId);
    setTimeout(() => sendNextMessage(sessionId), 1000);
    return;
  }
  
  // Get current Indian time
  const indianTime = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  // Send message with timeout
  const sendTimeout = setTimeout(() => {
    sendToSession(sessionId, { 
      type: 'log', 
      message: `Cookie ${session.currentCookieIndex + 1} timeout while sending message`,
      level: 'error'
    });
    cookie.active = false;
    moveToNextCookie(sessionId);
    updateSessionStats(sessionId);
    setTimeout(() => sendNextMessage(sessionId), session.delay * 1000);
  }, 30000); // 30 second timeout
  
  cookie.api.sendMessage(message, session.threadID, (err) => {
    clearTimeout(sendTimeout);
    
    if (err) {
      sendToSession(sessionId, { 
        type: 'log', 
        message: `Cookie ${session.currentCookieIndex + 1} failed to send message: ${err.message}`,
        level: 'error'
      });
      cookie.active = false;
    } else {
      session.totalMessagesSent++;
      cookie.sentCount = (cookie.sentCount || 0) + 1;
      
      sendToSession(sessionId, { 
        type: 'log', 
        message: `✅ [${indianTime}] Cookie ${session.currentCookieIndex + 1} sent message ${session.totalMessagesSent} to thread ${session.threadID} (Loop ${session.loopCount + 1}, Message ${messageIndex + 1}/${session.messages.length})`,
        level: 'success'
      });
    }
    
    session.currentMessageIndex++;
    
    if (session.currentMessageIndex >= session.messages.length) {
      session.currentMessageIndex = 0;
      session.loopCount++;
      sendToSession(sessionId, { 
        type: 'log', 
        message: `🔄 Completed loop ${session.loopCount}, restarting from first message`,
        level: 'info'
      });
    }
    
    moveToNextCookie(sessionId);
    updateSessionStats(sessionId);
    
    if (session.running) {
      setTimeout(() => sendNextMessage(sessionId), session.delay * 1000);
    }
  });
}

function moveToNextCookie(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  
  session.currentCookieIndex = (session.currentCookieIndex + 1) % session.cookies.length;
}

function updateSessionStats(sessionId, ws = null) {
  const session = sessions.get(sessionId);
  if (!session) return;
  
  const statsData = {
    type: 'stats',
    status: session.running ? 'Running' : 'Stopped',
    totalSent: session.totalMessagesSent,
    loopCount: session.loopCount,
    started: session.startTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true
    }),
    sessionId: sessionId
  };
  
  if (ws) {
    sendToClient(ws, statsData);
  } else {
    sendToSession(sessionId, statsData);
  }
}

function stopSending(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return false;
  
  session.cookies.forEach(cookie => {
    if (cookie.api) {
      try {
        cookie.api.logout();
      } catch (e) {
        console.error('Error logging out from cookie:', e);
      }
    }
  });
  
  session.running = false;
  sessions.delete(sessionId);
  
  sendToSession(sessionId, { type: 'status', running: false });
  sendToSession(sessionId, { 
    type: 'log', 
    message: 'Message sending stopped by user',
    level: 'success'
  });
  sendToSession(sessionId, {
    type: 'stats',
    status: 'Stopped',
    totalSent: session.totalMessagesSent,
    loopCount: session.loopCount,
    started: session.startTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true
    }),
    sessionId: sessionId
  });
  
  return true;
}

function getSessionDetails(sessionId, ws) {
  const session = sessions.get(sessionId);
  if (!session) {
    sendToClient(ws, { 
      type: 'log', 
      message: `Session ${sessionId} not found`,
      level: 'error'
    });
    return;
  }
  
  sendToClient(ws, {
    type: 'session_details',
    status: session.running ? 'Running' : 'Stopped',
    totalSent: session.totalMessagesSent,
    loopCount: session.loopCount,
    started: session.startTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true
    }),
    sessionId: sessionId
  });
}

function sendToClient(ws, data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function sendToSession(sessionId, data) {
  if (!wss) return;
  
  const sessionData = {...data, sessionId};
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(sessionData));
    }
  });
}

// Set up Express server
app.get('/', (req, res) => {
  res.send(htmlControlPanel);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`💌 Stable Message Sender Bot running at http://localhost:${PORT}`);
});

// Set up WebSocket server
wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'status', running: false }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'start') {
        startSending(
          ws,
          data.cookiesContent, 
          data.messageContent, 
          data.threadID, 
          data.delay, 
          data.prefix
        );
      } 
      else if (data.type === 'stop') {
        if (data.sessionId) {
          const stopped = stopSending(data.sessionId);
          if (!stopped) {
            sendToClient(ws, { 
              type: 'log', 
              message: `Session ${data.sessionId} not found`,
              level: 'error'
            });
          }
        }
      }
      else if (data.type === 'view_session') {
        if (data.sessionId) {
          getSessionDetails(data.sessionId, ws);
        }
      }
    } catch (err) {
      console.error('Error processing message:', err);
      sendToClient(ws, { 
        type: 'log', 
        message: `Error: ${err.message}`,
        level: 'error'
      });
    }
  });
});

// Clean up inactive sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastActivity > 24 * 60 * 60 * 1000) {
      console.log(`Cleaning up inactive session: ${sessionId}`);
      stopSending(sessionId);
    }
  }
}, 60 * 60 * 1000);

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  
  for (const [sessionId] of sessions.entries()) {
    stopSending(sessionId);
  }
  
  wss.close(() => {
    console.log('WebSocket server closed');
  });
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
