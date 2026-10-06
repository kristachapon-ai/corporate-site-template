const loginForm = document.getElementById("admin-login-form");
const usernameInput = document.getElementById("admin-username");
const passwordInput = document.getElementById("admin-password");
const message = document.getElementById("admin-login-message");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = loginForm.querySelector(
    'button[type="submit"]'
  );

  message.textContent = "";
  submitButton.disabled = true;
  submitButton.textContent = "SIGNING IN...";

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        password: passwordInput.value
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "ไม่สามารถเข้าสู่ระบบได้"
      );
    }

    window.location.href = "/admin/";
  } catch (error) {
    message.textContent = error.message;
    passwordInput.value = "";
    passwordInput.focus();
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "SIGN IN";
  }
});
