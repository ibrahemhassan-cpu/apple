/* فين وصل اللاعب: كل مرحلة خلّصها وكام نجمة أخد فيها، محفوظين على الجهاز.
   المرحلة بتتفتح لما اللي قبلها تخلص، والأولى مفتوحة دايمًا. */
import { useSyncExternalStore } from 'react';
import { LEVELS } from './levels.js';

const KEY = 'orchard-progress';
const listeners = new Set();

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return saved && typeof saved === 'object' && saved.done ? saved : { done: {} };
  } catch (e) {
    return { done: {} };                       // الوضع الخاص في المتصفح، أو تخزين مقفول
  }
}
let state = read();

function write(next) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) { /* مفيش تخزين */ }
  listeners.forEach(fn => fn());
}

export const getProgress = () => state;

/* بيحفظ أحسن نتيجة: لو لعبها تاني وجاب نجوم أقل، اللي قبلها بيفضل */
export function finishLevel(id, stars) {
  const best = Math.max(state.done[id] || 0, stars, 1);
  if (best === state.done[id]) return;
  write({ ...state, done: { ...state.done, [id]: best } });
}

export function resetProgress() { write({ done: {} }); }

export const starsOf = (progress, id) => progress.done[id] || 0;
export const isDone = (progress, id) => !!progress.done[id];
// a level he has already finished stays open even if a new one is added in front of it later
export const isUnlocked = (progress, i) => i === 0 || isDone(progress, LEVELS[i].id) || isDone(progress, LEVELS[i - 1].id);

/* أول مرحلة لسه مخلصتش — دي اللي الخريطة بتوقف عندها */
export function currentIndex(progress) {
  const i = LEVELS.findIndex(l => !isDone(progress, l.id));
  return i === -1 ? LEVELS.length - 1 : i;
}

export function useProgress() {
  return useSyncExternalStore(
    fn => { listeners.add(fn); return () => listeners.delete(fn); },
    getProgress,
  );
}
