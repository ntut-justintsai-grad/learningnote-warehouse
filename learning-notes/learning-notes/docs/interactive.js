for (const module of document.querySelectorAll('[data-stepper]')) {
  const steps = Array.from(module.querySelectorAll('[data-step]'));
  const previous = module.querySelector('[data-prev]');
  const next = module.querySelector('[data-next]');
  const progress = module.querySelector('[data-progress]');
  let index = 0;

  function move(offset) {
    const target = index + offset;
    if (target < 0 || target >= steps.length) return;
    steps[index].hidden = true;
    index = target;
    steps[index].hidden = false;
    progress.textContent = '步驟 ' + (index + 1) + ' / ' + steps.length;
    previous.disabled = index === 0;
    next.disabled = index === steps.length - 1;
    steps[index].querySelector('h3').focus();
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
}

for (const quiz of document.querySelectorAll('[data-quiz]')) {
  const questions = Array.from(quiz.querySelectorAll('fieldset'));
  const score = quiz.querySelector('[data-score]');

  function clearFeedback() {
    for (const question of questions) {
      question.querySelector('[data-feedback]').hidden = true;
      delete question.dataset.result;
    }
    score.textContent = '';
  }

  quiz.addEventListener('submit', event => {
    event.preventDefault();
    let correct = 0;
    for (const question of questions) {
      const selected = question.querySelector('input:checked');
      const feedback = question.querySelector('[data-feedback]');
      const passed = selected?.value === question.dataset.answer;
      if (passed) correct += 1;
      question.dataset.result = passed ? 'correct' : 'incorrect';
      feedback.querySelector('strong').textContent = passed ? '答對了。' : '再想一下。';
      feedback.hidden = false;
    }
    score.textContent = '答對 ' + correct + ' / ' + questions.length + ' 題';
  });
  quiz.addEventListener('reset', clearFeedback);
  quiz.addEventListener('change', clearFeedback);
}

