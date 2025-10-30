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
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
}

h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  color: #333;
  text-align: center;
}

h2 {
  margin: 0 0 2rem 0;
  font-size: 1.25rem;
  color: #666;
  font-weight: 400;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
  font-size: 0.95rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

input.error {
  border-color: #e53e3e;
}

input:disabled {
  background-color: #f7fafc;
  cursor: not-allowed;
}

.error-text {
  display: block;
  margin-top: 0.5rem;
  color: #e53e3e;
  font-size: 0.875rem;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.alert-error {
  background-color: #fff5f5;
  color: #c53030;
  border: 1px solid #feb2b2;
}

.btn {
  width: 100%;
  padding: 0.875rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>
