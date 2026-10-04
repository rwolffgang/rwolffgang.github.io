// Mission files: open/close dialogs and wire up their screenshot galleries.

const openMission = (id, opener) => {
	const dialog = document.getElementById(id);
	if (!dialog) return;

	const current = document.querySelector('dialog[open]');
	if (current && current !== dialog) {
		dialog.returnFocusTo = current.returnFocusTo;
		current.close();
	} else {
		dialog.returnFocusTo = opener;
	}

	dialog.showModal();
	dialog.querySelector('.mission-body, .mission-text')?.scrollTo(0, 0);
	history.replaceState(null, '', `#${id}`);
};

document.addEventListener('click', (event) => {
	const opener = event.target.closest('[data-open]');
	if (opener) {
		openMission(opener.dataset.open, opener);
		return;
	}

	if (event.target.closest('[data-close]')) {
		event.target.closest('dialog').close();
	}
});

for (const dialog of document.querySelectorAll('dialog.mission')) {
	// close when clicking the backdrop
	dialog.addEventListener('click', (event) => {
		if (event.target === dialog) dialog.close();
	});

	dialog.addEventListener('close', () => {
		if (!document.querySelector('dialog[open]')) {
			history.replaceState(null, '', location.pathname + location.search);
			dialog.returnFocusTo?.focus({ preventScroll: true });
		}
	});
}

// Galleries: scroll-snap track + generated arrows and dots
for (const gallery of document.querySelectorAll('.gallery')) {
	const track = gallery.querySelector('.gallery-track');
	const slides = [...track.children];

	const arrow = (direction, label) => {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = `gallery-arrow gallery-${direction}`;
		button.setAttribute('aria-label', label);
		button.innerHTML = `<svg class="icon${direction === 'prev' ? ' icon-flip' : ''}" aria-hidden="true"><use href="#arrow"/></svg>`;
		gallery.append(button);
		return button;
	};

	const prev = arrow('prev', 'Previous screenshot');
	const next = arrow('next', 'Next screenshot');

	const dots = document.createElement('div');
	dots.className = 'gallery-dots';
	slides.forEach((_, i) => {
		const dot = document.createElement('button');
		dot.type = 'button';
		dot.setAttribute('aria-label', `Screenshot ${i + 1} of ${slides.length}`);
		dot.addEventListener('click', () => goTo(i));
		dots.append(dot);
	});
	gallery.append(dots);

	// galleries start inside closed dialogs, where the track has no width yet
	const index = () => (track.clientWidth ? Math.round(track.scrollLeft / track.clientWidth) : 0);
	const goTo = (i) => track.scrollTo({ left: i * track.clientWidth });

	const update = () => {
		const i = index();
		prev.disabled = i <= 0;
		next.disabled = i >= slides.length - 1;
		[...dots.children].forEach((dot, d) => dot.setAttribute('aria-current', String(d === i)));
	};

	prev.addEventListener('click', () => goTo(index() - 1));
	next.addEventListener('click', () => goTo(index() + 1));
	track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
	track.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(index() - 1); }
		if (event.key === 'ArrowRight') { event.preventDefault(); goTo(index() + 1); }
	});

	update();
}

// Deep links like /#mission-snapshot open the matching mission file
const linked = document.getElementById(decodeURIComponent(location.hash.slice(1)));
if (linked?.matches('dialog.mission')) openMission(linked.id);
