<script>
(function () {
  const STAGING = window.location.hostname.includes(".webflow.io");
  const BASE_URL = STAGING
    ? "https://hive-dev.littlebeespeech.com"
    : "https://hive.littlebeespeech.com";

  const APP_ID = STAGING ? "lbs-hive-dev" : "lbs-hive";

  function getSessionToken() {
    return localStorage.getItem("sessionToken");
  }

  function setSessionToken(token) {
    localStorage.setItem("sessionToken", token);
  }

  function getUserEmail() {
    return localStorage.getItem("userEmail");
  }

  function setUserEmail(email) {
    localStorage.setItem("userEmail", email);
  }

  function getErrorTextEl(form) {
    return form.querySelector("[data-form-error-text]");
  }

  function showError(form, message) {
    const el = getErrorTextEl(form);
    if (el) {
      el.textContent = message;
      el.syle.display = "block";
    }
  }

  function clearError(form) {
    const el = getErrorTextEl(form);
    if (el) el.textContent = "";
    if (el) el.style.display = "none";
  }

  function getPurchaseParams() {
    const searchParams = new URLSearchParams(window.location.search);
    const licenseType = searchParams.get("licenseType");
    const licenseTerm = searchParams.get("licenseTerm");
    if (licenseType && licenseTerm) {
      return { licenseType, licenseTerm };
    }
    return null;
  }

  function redirectWithPurchaseParams(path, purchaseParams) {
    const searchParams = new URLSearchParams(purchaseParams);
    window.location.href = `${path}?${searchParams.toString()}`;
  }

  function redirectWithPreservedParams(path) {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.size > 0) {
      window.location.href = `${path}?${searchParams.toString()}`;
    } else {
      window.location.href = path;
    }
  }

  function getRedirect(form) {
    return form.getAttribute("data-redirect-success");
  }

  function withSubmitGuard(form, handler) {
    var submitting = false;
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (submitting) return;
      submitting = true;
      try {
        await handler(e);
      } finally {
        submitting = false;
      }
    });
  }

  function getFieldValues(form, fieldNames) {
    const data = {};
    for (const name of fieldNames) {
      const input = form.querySelector(`[name="${name}"]`);
      if (input) data[name] = input.value;
    }
    return data;
  }

  async function apiPost(path, body, headers = {}) {
    const res = await fetch(BASE_URL + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
    var data;
    try {
      data = await res.json();
    } catch (_) {
      throw new Error("Something went wrong. Please try again.");
    }
    if (!res.ok) {
      throw new Error(data.error || data.message || "Something went wrong");
    }
    return data;
  }

  function initResendEmailVerification(container) {
    const button = container.querySelector("[data-send-email-verification]");
    const status = container.querySelector("[data-send-email-status");

    button.addEventListener("click", async function (e) {
      e.preventDefault();

      const sessionToken = getSessionToken();
      if (!sessionToken) {
        console.warn("No sessionToken found during send email verification");
        window.location.href = "/sign-in";
        return;
      }

      let result = {
        isTooRecent: false,
        sent: true,
      };

      try {
        ({ result } = await apiPost(
          "/parse/functions/sendEmailVerificationWeb",
          {},
          {
            "X-Parse-Session-Token": sessionToken,
            "X-Parse-Application-Id": APP_ID,
          },
        ));
      } catch (err) {
        console.error("Error sending email verification:", err);
        result = {
          isTooRecent: false,
          sent: false,
        };
      }

      let text = "Email sent. The code is valid for 1 hour.";
      let color = "var(--_colors---teal)";

      if (!result.sent) {
        if (result.isTooRecent) {
          text =
            "Email already sent. Double check the email address and check your spam folder.";
        } else {
          text =
            "Email did not send. Double check the email address and check your spam folder.";
        }
        color = "red";
      }

      status.style.color = color;
      status.textContent = text;

      setTimeout(() => {
        status.textContent = "";
      }, 10000);
    });
  }
  function initPreserveParamLink(link) {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.size > 0) {
      const href = link.getAttribute("href");
      link.setAttribute("href", `${href}?${searchParams.toString()}`);
    }
  }

  // ── Sign In ──────────────────────────────────────────────

  function initSignin(form) {
    withSubmitGuard(form, async function () {
      clearError(form);
      const fields = getFieldValues(form, ["email", "password"]);
      try {
        const data = await apiPost("/webhook/hiveSignIn", fields);
        setSessionToken(data.token);
        setUserEmail(fields.email);
        const purchaseParams = getPurchaseParams();
        if (purchaseParams) {
          const checkoutResult = await apiPost("/stripeCheckout", purchaseParams, {
            "X-Parse-Session-Token": data.token,
          });
          window.location.href = checkoutResult.url;
        } else {
          window.location.href = getRedirect(form);
        }
      } catch (err) {
        showError(
          form,
          err.message.toLowerCase() === "invalid input"
            ? "Invalid password/username"
            : err.message,
        );
      }
    });
  }

  // ── Sign Up ──────────────────────────────────────────────

  function initSignup(form) {
    withSubmitGuard(form, async function () {
      clearError(form);
      const fields = getFieldValues(form, [
        "firstName",
        "lastName",
        "email",
        "password",
        "role",
      ]);
      try {
        const availability = await apiPost("/webhook/emailAvailable", {
          email: fields.email,
        });
        if (!availability.available) {
          const errorEl = getErrorTextEl(form);
          if (errorEl) {
            const errorMessage = document.createElement("span");
            errorMessage.textContent = "Email is already in use. ";
            errorEl.appendChild(errorMessage);
            const signInLink = document.createElement("a");
            signInLink.href = "/sign-in";
            signInLink.textContent = "Sign in";
            signInLink.classList.add("link-red");
            errorEl.appendChild(signInLink);
            errorEl.style.display = "block";
          }
          return;
        }
        const data = await apiPost("/webhook/userSignUp", fields);
        setSessionToken(data.token);
        setUserEmail(fields.email);
        const redirectPath = getRedirect(form);
        redirectWithPreservedParams(redirectPath);
      } catch (err) {
        showError(form, err.message);
      }
    });
  }

  // ── Verify Email ─────────────────────────────────────────

  function initVerifyEmail(form) {
    withSubmitGuard(form, async function () {
      clearError(form);
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        return;
      }

      const fields = getFieldValues(form, ["email", "code"]);
      if (!fields.email) {
        const email = getUserEmail();
        fields.email = email;
      }

      try {
        await apiPost("/parse/functions/verifyEmailWeb", fields, {
          "X-Parse-Session-Token": sessionToken,
          "X-Parse-Application-Id": APP_ID,
        });
        const path = getRedirect(form);
        redirectWithPreservedParams(path);
      } catch (err) {
        showError(form, err.message);
      }
    });
  }

  // ── Send Quote ───────────────────────────────────────────

  function initSendQuote(form) {
    withSubmitGuard(form, async function () {
      clearError(form);
      const fields = getFieldValues(form, [
        "orgName",
        "fullName",
        "role",
        "title",
        "email",
        "numLicenses",
        "hasOrdered",
        "heardAboutUs",
      ]);
      try {
        await apiPost("/webhook/sendMyQuote", fields);
        window.location.href = getRedirect(form);
      } catch (err) {
        showError(form, err.message);
      }
    });
  }

  // ── Change Email  ───────────────────────────────────

  function initChangeEmail(form) {
    withSubmitGuard(form, async function () {
      clearError(form);

      const errorEl = getErrorTextEl(form);

      if (errorEl?.hasChildNodes()) {
        errorEl.childNodes.forEach((node) => errorEl.removeChild(node));
      }

      const sessionToken = getSessionToken();
      if (!sessionToken) {
        console.warn("No sessionToken found during change email");
        return;
      }

      const fields = getFieldValues(form, ["newEmail"]);

      try {
        const availability = await apiPost("/webhook/emailAvailable", {
          email: fields.newEmail,
        });
        if (!availability.available) {
          const errorEl = getErrorTextEl(form);

          const errorMessage = document.createElement("p");
          errorMessage.textContent = "Email is already in use.";
          errorEl.appendChild(errorMessage);

          const signInLink = document.createElement("a");
          signInLink.href = "/sign-in";
          signInLink.textContent = "Sign in";
          signInLink.classList.add("link-red");
          errorEl.appendChild(signInLink);
          return;
        }
        await apiPost("/parse/functions/changeEmailSignupWeb", fields, {
          "X-Parse-Session-Token": sessionToken,
          "X-Parse-Application-Id": APP_ID,
        });
        setUserEmail(fields.newEmail);
        window.location.href = getRedirect(form);
      } catch (err) {
        showError(form, err.message);
      }
    });
  }

  // ── Forgot Password  ───────────────────────────────────

  function initForgotPassword(form) {
    withSubmitGuard(form, async function () {
      clearError(form);
      const fields = getFieldValues(form, ["emailAddress"]);

      try {
        await apiPost("/resetPassword", fields);
        setUserEmail(fields.emailAddress);
        window.location.href = getRedirect(form);
      } catch (err) {
        showError(form, err.message);
      }
    });
  }

  // ── Stripe Checkout ──────────────────────────────────────

  function initStripeCheckout(button) {
    button.addEventListener("click", async function (e) {
      e.preventDefault();

      const licenseType = button.getAttribute("data-license-type");
      const licenseTerm = button.getAttribute("data-license-term");
      
      if (licenseType === "group") {
        window.location.href = "/group-order#group-order-form";
        return;
      }

      const sessionToken = getSessionToken();
      if (!sessionToken) {
        redirectWithPurchaseParams("/sign-up", { licenseType, licenseTerm });
        return;
      }

      try {
        const data = await apiPost(
          "/stripeCheckout",
          { licenseType, licenseTerm },
          { "X-Parse-Session-Token": sessionToken },
        );
        window.location.href = data.url;
      } catch (err) {
        console.error("Stripe checkout error:", err.message);
      }
    });
  }

  // ── Init ─────────────────────────────────────────────────

  const formHandlers = {
    signin: initSignin,
    signup: initSignup,
    "verify-email": initVerifyEmail,
    "send-quote": initSendQuote,
    "change-email": initChangeEmail,
    "forgot-password": initForgotPassword,
  };

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-api-form]").forEach(function (form) {
      const name = form.getAttribute("data-api-form");
      const handler = formHandlers[name];
      if (handler) handler(form);
    });

    document.querySelectorAll("[data-stripe-checkout]").forEach(function (btn) {
      initStripeCheckout(btn);
    });

    document
      .querySelectorAll("[data-preserve-params]")
      .forEach(function (link) {
        initPreserveParamLink(link);
      });

    document
      .querySelectorAll("[data-send-email-verification-container]")
      .forEach((el) => initResendEmailVerification(el));
  });
})();
</script>