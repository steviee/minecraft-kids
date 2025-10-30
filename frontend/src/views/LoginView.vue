<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { AxiosError } from 'axios';
import type { ApiError } from '../types/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const emailError = ref('');
const passwordError = ref('');

function validateEmail(value: string): boolean {
  if (!value) {
    emailError.value = 'E-Mail ist erforderlich';
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    emailError.value = 'Ungültige E-Mail-Adresse';
    return false;
  }
  emailError.value = '';
  return true;
}

function validatePassword(value: string): boolean {
  if (!value) {
    passwordError.value = 'Passwort ist erforderlich';
    return false;
  }
  if (value.length < 6) {
    passwordError.value = 'Passwort muss mindestens 6 Zeichen lang sein';
    return false;
  }
  passwordError.value = '';
  return true;
}

function validateForm(): boolean {
  const isEmailValid = validateEmail(email.value);
  const isPasswordValid = validatePassword(password.value);
  return isEmailValid && isPasswordValid;
}

async function handleSubmit(): Promise<void> {
  errorMessage.value = '';

  if (!validateForm()) {
    return;
  }

  isLoading.value = true;

  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    });

    const redirectPath = (route.query.redirect as string) || '/dashboard';
    await router.push(redirectPath);
  } catch (error) {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as ApiError;
      errorMessage.value =
        apiError?.error || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.';
    } else {
      errorMessage.value = 'Ein unerwarteter Fehler ist aufgetreten.';
    }
  } finally {
    isLoading.value = false;
  }
}

function handleEmailBlur(): void {
  if (email.value) {
    validateEmail(email.value);
  }
}

function handlePasswordBlur(): void {
  if (password.value) {
    validatePassword(password.value);
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1>MCK Suite</h1>
      <h2>Anmeldung</h2>

      <form @submit.prevent="handleSubmit" novalidate>
        <div class="form-group">
          <label for="email">E-Mail</label>
          <input
            id="email"
            v-model="email"
            type="email"
            :class="{ error: emailError }"
            :disabled="isLoading"
            required
            autocomplete="email"
            aria-describedby="email-error"
            @blur="handleEmailBlur"
          />
          <span v-if="emailError" id="email-error" class="error-text" role="alert">
            {{ emailError }}
          </span>
        </div>

        <div class="form-group">
          <label for="password">Passwort</label>
          <input
            id="password"
            v-model="password"
            type="password"
            :class="{ error: passwordError }"
            :disabled="isLoading"
            required
            autocomplete="current-password"
            aria-describedby="password-error"
            @blur="handlePasswordBlur"
          />
          <span v-if="passwordError" id="password-error" class="error-text" role="alert">
            {{ passwordError }}
          </span>
        </div>

        <div v-if="errorMessage" class="alert alert-error" role="alert">
          {{ errorMessage }}
        </div>

        <button type="submit" :disabled="isLoading" class="btn btn-primary">
          <span v-if="isLoading">Wird angemeldet...</span>
          <span v-else>Anmelden</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Modern CSS Custom Properties for 2025 */
.login-container {
  --login-card-max-width-mobile: 420px;
  --login-card-max-width-tablet: 540px;
  --login-card-max-width-desktop: 700px;
  --login-card-max-width-large: 850px;
  --login-card-padding: clamp(2rem, 4vw, 3.5rem);
  --login-card-radius: 16px;

  min-block-size: 100vh;
  min-block-size: 100dvh; /* Modern viewport units */
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, oklch(65% 0.15 264) 0%, oklch(55% 0.18 308) 100%);
  padding-inline: 1rem;
  padding-block: 2rem;
}

.login-card {
  background: oklch(100% 0 0);
  padding: var(--login-card-padding);
  border-radius: var(--login-card-radius);
  box-shadow: 0 20px 60px oklch(0% 0 0 / 0.15);
  inline-size: 100%;
  max-inline-size: var(--login-card-max-width-mobile);
  container-type: inline-size;
  container-name: login-card;
}

/* Tablet screens */
@media (min-width: 768px) {
  .login-card {
    max-inline-size: var(--login-card-max-width-tablet);
  }
}

/* Desktop screens */
@media (min-width: 1280px) {
  .login-card {
    max-inline-size: var(--login-card-max-width-desktop);
  }
}

/* Large desktop screens */
@media (min-width: 1920px) {
  .login-card {
    max-inline-size: var(--login-card-max-width-large);
  }
}

h1 {
  margin-block-end: 0.5rem;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  color: oklch(25% 0 0);
  text-align: center;
  text-wrap: balance;
}

h2 {
  margin-block-end: 2rem;
  font-size: clamp(1.125rem, 2vw, 1.375rem);
  color: oklch(50% 0 0);
  font-weight: 400;
  text-align: center;
  text-wrap: balance;
}

.form-group {
  margin-block-end: 1.5rem;
  container-type: inline-size;
}

label {
  display: block;
  margin-block-end: 0.5rem;
  color: oklch(25% 0 0);
  font-weight: 500;
  font-size: clamp(0.875rem, 1.5vw, 1rem);
}

input {
  inline-size: 100%;
  padding-block: 0.875rem;
  padding-inline: 1rem;
  border: 2px solid oklch(90% 0 0);
  border-radius: 10px;
  font-size: clamp(0.9375rem, 1.5vw, 1.0625rem);
  transition:
    border-color 0.25s ease-out,
    box-shadow 0.25s ease-out,
    transform 0.15s ease-out;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: oklch(65% 0.15 264);
  box-shadow: 0 0 0 4px oklch(65% 0.15 264 / 0.1);
  transform: scale(1.01);
}

input.error {
  border-color: oklch(55% 0.22 25);
  box-shadow: 0 0 0 4px oklch(55% 0.22 25 / 0.1);
}

input:disabled {
  background-color: oklch(97% 0 0);
  cursor: not-allowed;
  opacity: 0.7;
}

.error-text {
  display: block;
  margin-block-start: 0.5rem;
  color: oklch(55% 0.22 25);
  font-size: clamp(0.8125rem, 1.2vw, 0.9375rem);
  font-weight: 500;
}

.alert {
  padding: 1.125rem;
  border-radius: 10px;
  margin-block-end: 1.5rem;
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  border-inline-start: 4px solid oklch(55% 0.22 25);
}

.alert-error {
  background-color: oklch(55% 0.22 25 / 0.08);
  color: oklch(35% 0.18 25);
  border: 1px solid oklch(55% 0.22 25 / 0.2);
}

.btn {
  inline-size: 100%;
  padding-block: 1rem;
  padding-inline: 1.5rem;
  border: none;
  border-radius: 10px;
  font-size: clamp(0.9375rem, 1.5vw, 1.0625rem);
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.2s ease-out;
}

.btn-primary {
  background: linear-gradient(135deg, oklch(65% 0.15 264) 0%, oklch(55% 0.18 308) 100%);
  color: oklch(100% 0 0);
  box-shadow: 0 4px 12px oklch(65% 0.15 264 / 0.25);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 8px 24px oklch(65% 0.15 264 / 0.35);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(-1px) scale(0.99);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
</style>
