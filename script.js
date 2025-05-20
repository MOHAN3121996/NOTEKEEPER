let notes = JSON.parse(localStorage.getItem("notes")) || [];
let isDarkMode = false;
let isSpeechEnabled = false;
let recognition;
let speechSynthesisUtterance;

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById("noteBody").value += transcript;
  };

  recognition.onerror = function(event) {
    console.error("Speech recognition error:", event.error);
  };

  recognition.onend = function() {
    console.log("Speech recognition ended.");
  };
} else {
  alert("Speech-to-text is not supported in this browser.");
}

function speakText(text) {
  if (!speechSynthesisUtterance) {
    speechSynthesisUtterance = new SpeechSynthesisUtterance();
  }
  speechSynthesisUtterance.text = text;
  speechSynthesis.speak(speechSynthesisUtterance);
}

function toggleSpeech() {
  const toggleSpeechButton = document.getElementById("toggleSpeech");
  if (isSpeechEnabled) {
    speechSynthesis.cancel();
    toggleSpeechButton.textContent = "Enable Text-to-Speech";
    isSpeechEnabled = false;
  } else {
    toggleSpeechButton.textContent = "Disable Text-to-Speech";
    isSpeechEnabled = true;
  }
}

function pauseSpeech() {
  if (speechSynthesis.speaking && !speechSynthesis.paused) {
    speechSynthesis.pause();
    console.log("Speech paused.");
  } else {
    console.log("Speech is not active or already paused.");
  }
}

function resumeSpeech() {
  if (speechSynthesis.paused) {
    speechSynthesis.resume();
    console.log("Speech resumed.");
  } else {
    console.log("Speech is not paused or not active.");
  }
}

function addNote() {
  const title = document.getElementById("noteTitle").value.trim();
  const body = document.getElementById("noteBody").value.trim();
  const fileInput = document.getElementById("noteFile");
  const file = fileInput.files[0];

  if (title === "") {
    alert("Note title cannot be blank.");
    return;
  }

  if (title === "" && body === "" && !file) {
    alert("Please provide a title, body, or file for the note.");
    return;
  }

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser) {
    alert("You must be logged in to add a note.");
    return;
  }

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString();
  const formattedDay = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

  const newNote = {
    id: Date.now(),
    title,
    body,
    date: formattedDate,
    day: formattedDay,
    file: file ? URL.createObjectURL(file) : null,
    fileName: file ? file.name : null,
    pinned: false,
    username: loggedInUser.username
  };

  notes.push(newNote);
  saveNotes();
  renderNotes();
  document.getElementById("noteTitle").value = "";
  document.getElementById("noteBody").value = "";
  fileInput.value = "";
}

function renderNotes() {
  const pinnedDiv = document.getElementById("pinnedNotes");
  const notesDiv = document.getElementById("notes");
  const searchText = document.getElementById("search").value.toLowerCase();

  pinnedDiv.innerHTML = "";
  notesDiv.innerHTML = "";

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser) {
   
    return;
  }

  notes
    .filter(note => {
      const matchesUser = note.username === loggedInUser.username;
      const matchesSearch = note.title.toLowerCase().includes(searchText) || note.body.toLowerCase().includes(searchText);
      return matchesUser && matchesSearch;
    })
    .sort((a, b) => b.pinned - a.pinned)
    .forEach(note => {
      const noteDiv = document.createElement("div");
      noteDiv.className = "note";

      noteDiv.innerHTML = `
        <h3>${note.title}</h3>
        <p>${note.body}</p>
        <p><strong>Date:</strong> ${note.date}</p>
        <p><strong>Day:</strong> ${note.day}</p>
        ${note.file && note.file.startsWith("data:image") ? `<img src="${note.file}" alt="Attached Image" style="max-width: 100%; border-radius: 5px; margin-top: 10px;" />` : ""}
        ${note.file && !note.file.startsWith("data:image") ? `<p><strong>Attachment:</strong> <a href="${note.file}" target="_blank">${note.fileName}</a></p>` : ""}
        <div class="actions">
          <button onclick="editNote(${note.id})">Edit</button>
          <button onclick="deleteNote(${note.id})">Delete</button>
          <button onclick="togglePin(${note.id})">${note.pinned ? "Unpin" : "Pin"}</button>
          <button onclick="speakText('${note.title} ${note.body}')">Speak</button>
          <button onclick="setReminder(${note.id})">Set Reminder</button>
        </div>
      `;

      if (note.pinned) {
        pinnedDiv.appendChild(noteDiv);
      } else {
        notesDiv.appendChild(noteDiv);
      }
    });
}

function editNote(id) {
  const note = notes.find(n => n.id === id);
  const newTitle = prompt("Edit title:", note.title);
  const newBody = prompt("Edit body:", note.body);
  if (newTitle !== null) note.title = newTitle;
  if (newBody !== null) note.body = newBody;
  saveNotes();
  renderNotes();
}

function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  saveNotes();
  renderNotes();
}

function togglePin(id) {
  const note = notes.find(n => n.id === id);
  note.pinned = !note.pinned;
  saveNotes();
  renderNotes();
}

function saveNotes() {
  localStorage.setItem("notes", JSON.stringify(notes));
}

function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle("dark", isDarkMode);
}

function registerUser() {
  const name = document.getElementById("name").value.trim();
  const gender = document.getElementById("gender").value;
  const dob = document.getElementById("dob").value;
  const phone = document.getElementById("phone").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !gender || !dob || !phone || !username || !password) {
    alert("Please fill in all fields.");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];
  if (users.some(user => user.username === username)) {
    alert("Username already exists. Please choose another.");
    return;
  }

  const newUser = { name, gender, dob, phone, username, password };
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  alert("Registration successful! You can now log in.");
  window.location.href = "login.html";
}

function loginUser() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find(user => user.username === username && user.password === password);

  if (!user) {
    alert("Invalid username or password.");
    return;
  }

  localStorage.setItem("loggedInUser", JSON.stringify(user));
  alert("Login successful!");
  window.location.href = "landing.html";
}

function updateNavBar() {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const registerLink = document.querySelector(".nav-bar a[href='register.html']");
  const loginLink = document.querySelector(".nav-bar a[href='login.html']");
  const logoutLink = document.querySelector(".nav-bar a[onclick='logoutUser()']");

  if (loggedInUser) {
    if (registerLink) registerLink.style.display = "none";
    if (loginLink) loginLink.style.display = "none";
    if (logoutLink) logoutLink.style.display = "inline";
  } else {
    if (registerLink) registerLink.style.display = "inline";
    if (loginLink) loginLink.style.display = "inline";
    if (logoutLink) logoutLink.style.display = "none";
  }
}

function logoutUser() {
  localStorage.removeItem("loggedInUser");
  alert("You have been logged out.");
  window.location.href = "landing.html";
}

function showError(message) {
  alert(message);
}

function setReminder(noteId) {
  const reminderTime = prompt("Enter reminder time in HH:MM format (24-hour clock):");
  if (!reminderTime) return;

  const [hours, minutes] = reminderTime.split(":").map(Number);
  const now = new Date();
  const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

  if (reminderDate < now) {
    alert("The reminder time must be in the future.");
    return;
  }

  const timeUntilReminder = reminderDate - now;
  setTimeout(() => {
    alert("Reminder: " + notes.find(note => note.id === noteId).title);
    const audio = new Audio("ringtone.mp3"); // Ensure ringtone.mp3 is in the project directory
    audio.play();
  }, timeUntilReminder);

  alert("Reminder set for " + reminderTime);
}

function startSpeechToText() {
  if (recognition) {
    recognition.start();
  } else {
    alert("Speech-to-text is not supported in this browser.");
  }
}

function forgotPassword() {
  const username = prompt("Enter your username:");
  if (!username) {
    alert("Username is required to reset the password.");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find(user => user.username === username);

  if (!user) {
    alert("No account found with the provided username.");
    return;
  }

  const newPassword = prompt("Enter your new password:");
  if (!newPassword) {
    alert("Password cannot be empty.");
    return;
  }

  user.password = newPassword;
  localStorage.setItem("users", JSON.stringify(users));
  alert("Password reset successful! You can now log in with your new password.");
}

function checkLoginStatus() {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser) {
    alert("Please log in to access the app.");
    return;
  }
  // Redirect to the main app page
  window.location.href = "index.html";
}

function showLoginMessage() {
  alert("Please log in to access this feature.");
}

function showQuizRules() {
  const modal = document.getElementById('quizRulesModal');
  if (modal) {
    modal.style.display = 'block';
  }
}

function closeQuizRules() {
  const modal = document.getElementById('quizRulesModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

let timeValue = 15;
let que_count = 0;
let que_numb = 1;
let userScore = 0;
let counter;
let counterLine;
let widthValue = 0;

function continueQuiz() {
  document.querySelector('.info_box').classList.remove('activeInfo');
  document.querySelector('.quiz_box').classList.add('activeQuiz');
  showQuestion(que_count);
  queCounter(que_numb);
  startTimer(timeValue);
  startTimerLine(widthValue);
}

function exitQuiz() {
  window.location.href = 'index.html';
}

function showQuestion(index) {
  const que_text = document.querySelector('.que_text');
  const option_list = document.querySelector('.option_list');
  let que_tag = `<span>${questions[index].numb}. ${questions[index].question}</span>`;
  let option_tag = questions[index].options.map(option => `<div class="option">${option}</div>`).join('');
  que_text.innerHTML = que_tag;
  option_list.innerHTML = option_tag;
}

function nextQuestion() {
  if (que_count < questions.length - 1) {
    que_count++;
    que_numb++;
    showQuestion(que_count);
    queCounter(que_numb);
  } else {
    showResult();
  }
}

function showResult() {
  document.querySelector('.quiz_box').classList.remove('activeQuiz');
  document.querySelector('.result_box').classList.add('activeResult');
}

// Function to start the quiz and display questions dynamically
function startQuiz() {
  const questionContainer = document.getElementById('questionContainer');
  const questionData = questions[currentQuestionIndex];

  if (questionData) {
    questionContainer.innerHTML = `
      <h2>${questionData.numb}. ${questionData.question}</h2>
      <ul>
        ${questionData.options.map((option, index) => `<li onclick="selectAnswer(${index})">${option}</li>`).join('')}
      </ul>
    `;
  } else {
    showResult();
  }
}

// Function to handle answer selection
function selectAnswer(selectedIndex) {
  const questionData = questions[currentQuestionIndex];
  const selectedOption = questionData.options[selectedIndex];

  if (isSpeechEnabled) {
    speakText(`You selected: ${selectedOption}`);
  }

  if (selectedOption === questionData.answer) {
    userScore++;
  }
  currentQuestionIndex++;
  startQuiz();
}

// Function to display the final result
function showResult() {
  const questionContainer = document.getElementById('questionContainer');
  questionContainer.innerHTML = `<h2>Quiz Completed!</h2><p>Your score: ${userScore} / ${questions.length}</p>`;
}

// Initialize quiz on page load if ?start=true is present
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('start') === 'true') {
    currentQuestionIndex = parseInt(localStorage.getItem('currentQuestionIndex')) || 0;
    userScore = 0;
    startQuiz();
  }
});

function subscribeUser() {
  const email = document.getElementById('subscriberEmail').value.trim();
  if (!email) {
    alert('Please enter a valid email address.');
    return;
  }
  // Show a popup message for successful subscription
  const popup = document.createElement('div');
  popup.textContent = `Thank you for subscribing! Updates will be sent to ${email}.`;
  popup.style.position = 'fixed';
  popup.style.bottom = '20px';
  popup.style.right = '20px';
  popup.style.backgroundColor = '#4CAF50';
  popup.style.color = 'white';
  popup.style.padding = '10px 20px';
  popup.style.borderRadius = '5px';
  popup.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  popup.style.zIndex = '1000';
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 3000);

  document.getElementById('subscribeForm').reset();
}

document.getElementById("search").addEventListener("input", renderNotes);
document.addEventListener("DOMContentLoaded", () => {
  const homeLink = document.querySelector(".nav-bar a[href='index.html']");
  if (homeLink) {
    homeLink.href = "landing.html";
  }
  const loggedInUser = localStorage.getItem("loggedInUser");
  if (!loggedInUser) {
   
    window.location.href = "login.html";
  }
  updateNavBar();
  renderNotes();

  const quizLink = document.querySelector('a[href="quiz.html"]');
  if (quizLink) {
    quizLink.addEventListener('click', (event) => {
      event.preventDefault();
      showQuizRules();
    });
  }

  const currentPath = window.location.pathname;
  if (currentPath.includes('quiz.html')) {
    showQuizRules();
  }
});