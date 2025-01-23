// Initialize Supabase Client
const supabaseUrl = 'https://svfywvygfmoiubctakbq.supabase.co'; // Your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2Znl3dnlnZm1vaXViY3Rha2JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0Nzk2NTMsImV4cCI6MjA1MzA1NTY1M30.6bh41HwAsjyl0kSVIWi5Dv-TOWlUlcJ0mWeoBBJQ9bk'; // Your Supabase Anon Key
const supabaseroleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2Znl3dnlnZm1vaXViY3Rha2JxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ3OTY1MywiZXhwIjoyMDUzMDU1NjUzfQ.alXVxMeAKHImGrZoHY9gLn8F2NYzEN43EPCNSSgGFSA'; // Service role key
const supabase = window.supabase.createClient(supabaseUrl, supabaseroleKey);

let users;
let sender = sessionStorage.getItem('sender');
let receiver;
let receiver_fullname;
let fullName = "";


window.addEventListener('DOMContentLoaded', async () => {
  // Subscribe to the `INSERT` event for new messages
  const channel = supabase
    .channel('realtime:messages') // Unique channel name
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' }, // Listen to inserts on the "messages" table
      (payload) => {
        // Check if the message is for the current conversation
        if (
          // (payload.new.sender_email === sender && payload.new.receiver_email === receiver) 
          // ||
          (payload.new.sender_email === receiver && payload.new.receiver_email === sender)
        ) {
          // Add the new message to the DOM
          const messagesContainer = document.getElementById('messages-container');
          const messageElement = document.createElement('div');
          messageElement.classList.add('message');
          if (payload.new.sender_email === sender) {
            messageElement.classList.add('sent');
          } else {
            messageElement.classList.add('received');
          }
          messageElement.innerHTML = `
            <strong>${payload.new.sender_fullname}</strong>: ${payload.new.content}
            <br><small>${new Date(payload.new.created_at).toLocaleTimeString()}</small>
          `;
          messagesContainer.appendChild(messageElement);

          // Scroll to the latest message
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }
    )
    .subscribe();

  if (!channel) {
    console.error('Error subscribing to real-time updates.');
  } else {
    console.log('Real-time subscription established.');
  }
});



// Function to load users
async function loadUsers() {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('Error fetching users:', error.message);
      return;
    }

    const usersContainer = document.getElementById('users-container');
    usersContainer.innerHTML = ''; // Clear previous users


    console.log("data24", data);
    console.log("data25", data.users.user_metadata);



    data.users.forEach((user) => {

      console.log("user.user_metadata?.full_name", user.user_metadata?.full_name);
      console.log("token.user.full_name", token.user.user_metadata?.full_name);
      // if (user.email === token.user.email) return; // Skip current user
      if (user.user_metadata?.full_name === token.user.user_metadata?.full_name) return; 
      
      const userElement = document.createElement('div');
      userElement.classList.add('user-item');
      userElement.textContent = user.user_metadata?.full_name;
      userElement.onclick = () => {
        console.log("user69", user);
        receiver = user.email;
        receiver_fullname = user.user_metadata?.full_name;
        fullName = user.user_metadata?.full_name || receiver.split('@')[0];
        document.querySelector('.main-content h1').textContent = `Chat with ${fullName}`;
        // alert(`Chatting with: ${receiver}`);
        loadMessages();
      };
      usersContainer.appendChild(userElement);
    });
  }

console.log("receiver211", receiver);

// Function to send a new message (with sender and receiver)
async function sendMessage() {
  const messageContent = document.getElementById('message-input').value;

  if (!messageContent.trim()) {
    alert('Message cannot be empty');
    return;
  }

  if (!receiver) {
    alert('Please select a user to chat with.');
    return;
  }

  // alert(`message1`);

  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        sender_email: token.user.email,
        receiver_email: receiver,
        content: messageContent,
        sender_fullname: token.user.user_metadata.full_name,
        receiver_fullname: receiver_fullname,
      },
    ]);

  if (error) {
    alert('Error sending message:', error.message);
  } else {
    document.getElementById('message-input').value = ''; // Clear the input field
    loadMessages();
  }
}

// Function to get all users
async function getAllUsers() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
  } else {
    console.log('All users:', data);
    users = data;
  }
}
getAllUsers();

// Global variable to store user token
let token = sessionStorage.getItem('token');
if (token) {
  token = JSON.parse(token);
}

// Function to set the token in session storage and update UI
function setToken(data) {
  token = data;
  sessionStorage.setItem('token', JSON.stringify(data));
  sessionStorage.setItem('sender', data.user.email);
  renderChatPage();
}


function renderChatPage() {
  const appDiv = document.getElementById('app');

  if (!token) {
    renderLoginPage();
  } else {
    appDiv.innerHTML = `
      <div class="content">
        <div class="sidebar" id="user-list">
          <h2>Users</h2>
          <div id="users-container">
          </div>
        </div>
        <div class="main-content">
          <div class="chat-header">
            <h1>${fullName.length ? fullName : "Chat"}</h1>
            <div class="top-right-actions">
              <button onclick="logout()" title="Logout">Logout</button>
             
            </div>
          </div>
          <div class="messages-container" id="messages-container"></div>
          <textarea id="message-input" placeholder="Type a message..." rows="4"  onkeydown="handleKeyDown(event)"></textarea>
          <div class="chat-actions">
            <button onclick="sendMessage()">Send</button>
          </div>
        </div>
      </div>
    `;
    loadUsers();
    loadMessages();
  }
}

function handleKeyDown(event) {
  // Check if the Enter key is pressed (and not with Shift for a new line)
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // Prevent adding a new line
    sendMessage(); // Call the sendMessage function
  }
}



async function loadMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('sender_email, receiver_email, sender_fullname, content, created_at')
    .or(
      `and(sender_email.eq.${sender},receiver_email.eq.${receiver}),and(sender_email.eq.${receiver},receiver_email.eq.${sender})`
    )
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error loading messages:', error);
    return;
  }
  console.log("message data", data);
  console.log("sender24", sender, "receiver", receiver);

  const messagesContainer = document.getElementById('messages-container');
  messagesContainer.innerHTML = ''; // Clear previous messages

  data.forEach((message) => {
    console.log("262 msggggggggggggg",message);
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    if (message.sender_email === sender) {
      messageElement.classList.add('sent');
    } else {
      messageElement.classList.add('received');
    }
    messageElement.innerHTML = `
      <strong>${message.sender_fullname}</strong>: ${message.content}
      <br><small>${new Date(message.created_at).toLocaleTimeString()}</small>
    `;
    messagesContainer.appendChild(messageElement);
  });
 

  setTimeout(() => {
    messagesContainer.scrollTo({
      top: 200, // Arbitrary value to test scrolling
      behavior: 'smooth',
    });
  }, 1000);
}


function renderSignUpPage() {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = `
    <div class="auth-form-container">
      <div class="auth-form">
        <h1>Sign Up</h1>
        <form id="signup-form">
          <input type="text" id="fullName" placeholder="Full Name" required />
          <input type="email" id="email" placeholder="Email" required />
          <input type="password" id="password" placeholder="Password" required />
          <button type="submit">Sign Up</button>
        </form>
        <p>Already have an account? <a href="#" onclick="renderLoginPage()">Login</a></p>
      </div>
    </div>
  `;

  document.getElementById('signup-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      alert('Please check your email for verification.');
    } catch (error) {
      alert(error.message);
    }
  });
}


// Function to render the Login page

function renderLoginPage() {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = `
    <div class="auth-form-container">
      <div class="auth-form">
        <h1>Login</h1>
        <form id="login-form">
          <input type="email" id="email" placeholder="Email" required />
          <input type="password" id="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
        <p>Don't have an account? <a href="#" onclick="renderSignUpPage()">Sign Up</a></p>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      console.log("login data", data);
      sender = data.user.email;
      console.log("sender", sender);
      setToken(data);
    } catch (error) {
      alert(error.message);
    }
  });
}




// Log out the user
function logout() {
  sessionStorage.removeItem('token');
  token = null;
  renderChatPage();
}

// Initial render when the page loads
renderChatPage();
