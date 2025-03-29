// Alert notification system
function showAlert(type = 'error', message) {
  const container = document.getElementById('alert-container');
  const templateId = `${type}-alert-template`;
  const template = document.getElementById(templateId);
  
  if (!template) return;
  
  // Clone the template
  const alert = template.firstElementChild.cloneNode(true);
  alert.classList.remove('hidden');
  
  // Set message if provided
  const messageEl = alert.querySelector('p');
  if (messageEl && message) {
      messageEl.textContent = message;
  }
  
  // Add close button handler
  const closeBtn = alert.querySelector('button');
  if (closeBtn) {
      closeBtn.addEventListener('click', () => {
          alert.remove();
      });
  }
  
  // Add to container
  container.prepend(alert);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
      alert.remove();
  }, 5000);
}

// Initialize users array in localStorage if it doesn't exist
if (!localStorage.getItem('users')) {
  localStorage.setItem('users', JSON.stringify([]));
}

// DOM Elements
const loginForm = document.getElementById('login');
const signupForm = document.getElementById('signup');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const loginFormSection = document.getElementById('login-form');
const signupFormSection = document.getElementById('signup-form');

// Toggle between login and signup forms
showSignup.addEventListener('click', (e) => {
  e.preventDefault();
  loginFormSection.classList.add('hidden');
  signupFormSection.classList.remove('hidden');
});

showLogin.addEventListener('click', (e) => {
  e.preventDefault();
  signupFormSection.classList.add('hidden');
  loginFormSection.classList.remove('hidden');
});

// Simple hash function for password (not production-grade)
function simpleHash(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

// Password strength check
function checkPasswordStrength(password) {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const mediumRegex = /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*\d))|((?=.*[A-Z])(?=.*\d)))(?=.{6,})/;
  
  if (strongRegex.test(password)) return 'strong';
  if (mediumRegex.test(password)) return 'medium';
  return 'weak';
}

// Signup form submission
signupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  // Validate password match
  if (password !== confirmPassword) {
      showAlert('error', 'Passwords do not match!');
      return;
  }

  // Check if user already exists
  const users = JSON.parse(localStorage.getItem('users'));
  const existingUser = users.find(user => user.email === email);
  
  if (existingUser) {
      showAlert('error', 'User with this email already exists!');
      return;
  }

  // Create new user
  const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: simpleHash(password), // In a real app, use proper hashing
      createdAt: new Date().toISOString()
  };

  // Save user
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('currentUser', JSON.stringify(newUser));

  showAlert('success', 'Account created successfully!');
  setTimeout(() => {
      window.location.href = 'dashboard.html';
  }, 1500);
});

// Login form submission
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const rememberMe = document.getElementById('remember-me').checked;

  // Find user
  const users = JSON.parse(localStorage.getItem('users'));
  const user = users.find(user => 
      user.email === email && 
      user.password === simpleHash(password)
  );

  if (!user) {
      showAlert('error', 'Incorrect password. Please try again.');
      return;
  }

  // Save current user
  localStorage.setItem('currentUser', JSON.stringify(user));
  
  if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
  } else {
      localStorage.removeItem('rememberedEmail');
  }

  showAlert('success', 'Login successful!');
  setTimeout(() => {
      window.location.href = 'dashboard.html';
  }, 1500);
});

// Check for remembered email on page load and load profile pic
window.addEventListener('DOMContentLoaded', () => {
  const rememberedEmail = localStorage.getItem('rememberedEmail');
  if (rememberedEmail) {
      document.getElementById('login-email').value = rememberedEmail;
      document.getElementById('remember-me').checked = true;
  }

  // Load profile picture if on dashboard
  if (window.location.pathname.includes('dashboard.html')) {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (currentUser && currentUser.profilePic) {
          const profilePic = document.getElementById('profile-pic');
          if (profilePic) {
              profilePic.src = currentUser.profilePic;
          }
      }
  }
});

// Profile picture upload handler
function handleProfilePicUpload(event) {
  const file = event.target.files[0];
  if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
          const currentUser = JSON.parse(localStorage.getItem('currentUser'));
          if (currentUser) {
              currentUser.profilePic = e.target.result;
              localStorage.setItem('currentUser', JSON.stringify(currentUser));
              
              // Update in users array
              const users = JSON.parse(localStorage.getItem('users'));
              const updatedUsers = users.map(user => 
                  user.id === currentUser.id ? currentUser : user
              );
              localStorage.setItem('users', JSON.stringify(updatedUsers));
              
              // Update all profile picture displays
              updateProfilePictures(e.target.result);
          }
      };
      reader.readAsDataURL(file);
  }
}

// Update all profile picture displays
function updateProfilePictures(newSrc) {
  // Update in dashboard
  const dashboardPic = document.getElementById('profile-pic');
  if (dashboardPic) dashboardPic.src = newSrc;
  
  // Update in profile page
  const profileDisplay = document.getElementById('profile-display');
  if (profileDisplay) profileDisplay.src = newSrc;
  
  // Force refresh if on same page
  if (window.location.pathname.includes('profile.html')) {
      const profilePicInput = document.getElementById('profile-upload');
      if (profilePicInput) profilePicInput.value = '';
  }
}

// Initialize profile picture functionality
function initProfilePictures() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser?.profilePic) {
      updateProfilePictures(currentUser.profilePic);
  }
}

// Profile save handler
function handleProfileSave() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) return;

  const newName = document.getElementById('profile-name').value;
  currentUser.name = newName;
  
  // Save current profile picture from display
  const profileDisplay = document.getElementById('profile-display');
  if (profileDisplay && profileDisplay.src !== currentUser.profilePic) {
      currentUser.profilePic = profileDisplay.src;
  }
  
  // Update storage
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  const users = JSON.parse(localStorage.getItem('users'));
  const updatedUsers = users.map(u => u.id === currentUser.id ? currentUser : u);
  localStorage.setItem('users', JSON.stringify(updatedUsers));
  
  // Update all displays
  updateProfilePictures(currentUser.profilePic);
  showAlert('success', 'Profile updated successfully!');
  setTimeout(() => {
      window.location.href = 'dashboard.html';
  }, 1500);
}

// Toggle password visibility
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) {
      console.warn(`Input element with ID ${inputId} not found`);
      return;
  }
  const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
  input.setAttribute('type', type);
  
  // Toggle eye icon if it exists
  const eyeIcon = input.nextElementSibling?.querySelector('i');
  if (eyeIcon) {
      eyeIcon.classList.toggle('fa-eye');
      eyeIcon.classList.toggle('fa-eye-slash');
  }
}

// Password reset functionality
function setupPasswordReset() {
  const forgotPassword = document.getElementById('forgot-password');
  const resetModal = document.getElementById('password-reset-modal');
  const cancelReset = document.getElementById('cancel-reset');
  const resetForm = document.getElementById('reset-password-form');
  const eyeBtn = document.querySelector('#new-password + button');

  // Check if elements exist before adding event listeners
  if (!forgotPassword || !resetModal || !cancelReset || !resetForm || !eyeBtn) {
      console.warn('Password reset elements not found');
      return;
  }

  // Toggle modal
  forgotPassword.addEventListener('click', (e) => {
      e.preventDefault();
      resetModal.classList.remove('hidden');
  });

  cancelReset.addEventListener('click', () => {
      resetModal.classList.add('hidden');
  });

  // Toggle password visibility
  eyeBtn.addEventListener('click', () => {
      const icon = eyeBtn.querySelector('i');
      togglePasswordVisibility('new-password');
      icon.classList.toggle('fa-eye');
      icon.classList.toggle('fa-eye-slash');
  });

  // Handle password reset
  resetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('reset-email').value;
      const newPassword = document.getElementById('new-password').value;
      
      // Find user
      const users = JSON.parse(localStorage.getItem('users'));
      const user = users.find(u => u.email === email);
      
      if (!user) {
          showAlert('error', 'No account found with that email');
          return;
      }

      // Update password
      user.password = simpleHash(newPassword);
      localStorage.setItem('users', JSON.stringify(users));
      
      // Update current user if logged in
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (currentUser && currentUser.email === email) {
          currentUser.password = user.password;
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }

      showAlert('success', 'Password updated successfully');
      resetModal.classList.add('hidden');
      resetForm.reset();
  });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  setupPasswordReset();
  const rememberedEmail = localStorage.getItem('rememberedEmail');
  if (rememberedEmail) {
      document.getElementById('login-email').value = rememberedEmail;
      document.getElementById('remember-me').checked = true;
  }
  
  initProfilePictures();
  
  // Setup profile save button if on profile page
  if (window.location.pathname.includes('profile.html')) {
      document.getElementById('save-profile-btn').addEventListener('click', handleProfileSave);
  }
});
