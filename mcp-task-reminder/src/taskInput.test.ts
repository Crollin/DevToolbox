import assert from 'node:assert/strict';
import test from 'node:test';
import { toTaskInput } from './taskInput.js';

test('toTaskInput does not turn omitted fields into explicit clears', () => {
  const payload = JSON.parse(JSON.stringify(toTaskInput({ title: 'Nouveau titre' })));

  assert.deepEqual(payload, { title: 'Nouveau titre' });
});

test('toTaskInput preserves explicit clear values', () => {
  const payload = JSON.parse(JSON.stringify(toTaskInput({
    title: 'Nettoyer la tâche',
    dueDate: null,
    description: '',
    client: '',
    link: '',
    tags: [],
    notificationChannels: [],
    reminderDays: [],
    reminderDatetime: '',
  })));

  assert.deepEqual(payload, {
    title: 'Nettoyer la tâche',
    dueDate: null,
    description: '',
    client: '',
    link: '',
    tags: [],
    notificationChannels: [],
    reminderDays: [],
    reminderDatetime: '',
  });
});
