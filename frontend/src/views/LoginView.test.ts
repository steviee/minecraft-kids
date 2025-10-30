import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import LoginView from './LoginView.vue';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/login', component: { template: '<div>Login</div>' } },
    { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
  ],
});

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders login form', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router, createPinia()],
      },
    });

    expect(wrapper.find('h1').text()).toBe('MCK Suite');
    expect(wrapper.find('h2').text()).toBe('Anmeldung');
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('shows validation errors for empty fields', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router, createPinia()],
      },
    });

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('erforderlich');
  });

  it('shows validation error for invalid email format', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router, createPinia()],
      },
    });

    const emailInput = wrapper.find('input[type="email"]');
    await emailInput.setValue('invalid-email');
    await emailInput.trigger('blur');

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Ungültige E-Mail-Adresse');
  });

  it('shows validation error for short password', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router, createPinia()],
      },
    });

    const passwordInput = wrapper.find('input[type="password"]');
    await passwordInput.setValue('12345');
    await passwordInput.trigger('blur');

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('mindestens 6 Zeichen');
  });

  it('submits form with valid data', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router, createPinia()],
      },
    });

    const authStore = useAuthStore();
    const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue();

    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('input[type="password"]');

    await emailInput.setValue('test@example.com');
    await passwordInput.setValue('password123');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    await wrapper.vm.$nextTick();

    expect(loginSpy).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('disables form inputs during loading', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [router, createPinia()],
      },
    });

    const authStore = useAuthStore();
    vi.spyOn(authStore, 'login').mockImplementation(() => new Promise(() => {}));

    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('input[type="password"]');

    await emailInput.setValue('test@example.com');
    await passwordInput.setValue('password123');

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    await wrapper.vm.$nextTick();

    expect((emailInput.element as HTMLInputElement).disabled).toBe(true);
    expect((passwordInput.element as HTMLInputElement).disabled).toBe(true);
  });
});
