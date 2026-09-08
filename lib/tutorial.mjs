export const TUTORIAL = [
  {
    title: 'Your first harvest starts here',
    text: 'Your job is to help three leaf cells support a tomato plant. Let’s practise together. Your saved plant and stars stay safe.',
    target: null,
  },
  {
    title: 'Step inside a leaf cell',
    text: 'Choose Cell at the top right. This opens the structures that keep your plant alive.',
    target: 'cell-view',
  },
  {
    title: 'Help the chloroplast make sugar',
    text: 'Select Develop capacity. Chloroplasts use light to make sugar. This investment costs 24 sugar and 22 energy.',
    target: 'upgrade',
  },
  {
    title: 'Choose a production priority',
    text: 'Choose Produce below. Sugar production speeds up, but it uses more water. Watch both reserves.',
    target: 'produce',
  },
  {
    title: 'Watch your reserves grow',
    text: 'The clock is running now. Wait until sugar reaches 32. That leaves a small reserve after your next action.',
    target: 'resources',
    running: true,
  },
  {
    title: 'Support the whole plant',
    text: 'Choose Support plant growth. It uses 20 sugar, 18 energy and 12 water. The job takes 12 game seconds.',
    target: 'grow',
  },
  {
    title: 'Your cell is working',
    text: 'Watch the countdown. When it finishes, your plant earns 20 growth points. You do not need to click repeatedly.',
    target: 'grow',
    running: true,
  },
  {
    title: 'Check another cell',
    text: 'Choose Sheltered. Each cell has its own reserves and priority. Looking after one cell does not automatically look after the others.',
    target: 'sheltered',
  },
  {
    title: 'Let this cell contribute too',
    text: 'Choose Support plant growth again. Sheltered uses its own reserves, and both cells support the same plant.',
    target: 'grow',
  },
  {
    title: 'Two cells, one shared goal',
    text: 'Wait for Sheltered to finish. Its contribution joins the first cell’s points in the harvest meter.',
    target: 'grow',
    running: true,
  },
  {
    title: 'See what you have grown',
    text: 'Choose Plant at the top right. Your contributions help the plant develop leaves, then flowers and fruit.',
    target: 'plant-view',
  },
  {
    title: 'You are ready to grow',
    text: 'For your real harvest: reach the growth target, make 3 developments, earn 40 points from EACH cell, reach the required day and keep EVERY cell at 60+ health. Save sugar for night; use Conserve when water is low.',
    target: null,
  },
];
export function nextTutorialStep(step, s, view) {
  const conditions = {
    1: view === 'cell',
    2: s.cells[0].upgrades.chloroplast >= 1,
    3: s.cells[0].focus === 'produce',
    4: s.cells[0].sugar >= 32,
    5: !!s.cells[0].job,
    6: s.cells[0].growth >= 20,
    7: s.selectedCell === 1,
    8: !!s.cells[1].job,
    9: s.cells[1].growth >= 20,
    10: view === 'plant',
  };
  return conditions[step] ? step + 1 : step;
}
export function tutorialAllows(step, action, value) {
  if (step === null) return true;
  return (
    (step === 2 && action === 'upgrade' && value === 'chloroplast') ||
    (step === 3 && action === 'focus' && value === 'produce') ||
    ([5, 8].includes(step) && action === 'grow')
  );
}
