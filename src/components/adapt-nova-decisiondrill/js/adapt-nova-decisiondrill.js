import components from 'core/js/components';
import ComponentView from 'core/js/views/componentView';
import ComponentModel from 'core/js/models/componentModel';

class NovaDecisionDrillModel extends ComponentModel {}

class NovaDecisionDrillView extends ComponentView {

  postRender() {
    this.pack = this._normalise(this.model.get('_pack') || {});
    this.state = { i: 0, score: 0, meter: 100, streak: 0, best: 0, clean: 0, locked: false, timer: null, t0: 0 };
    this.widget = this.$('.js-nova-dd-widget')[0];
    if (!this.pack.scenarios || !this.pack.scenarios.length) {
      this.widget.innerHTML = '<p class="nova-dd-error">Decision Drill: no content pack supplied.</p>';
      this.setReadyStatus();
      return;
    }
    this._applyAccent();
    this._renderBoot();
    this.setReadyStatus();
  }

  // ---- accept the authorable (Course Designer) pack schema ----
  _normalise(p) {
    if (!p || p._normalised) return p || {};
    const authorable = p.scenarios && p.scenarios[0] && p.scenarios[0].options &&
      p.scenarios[0].options[0] && ('label' in p.scenarios[0].options[0]);
    if (!authorable) { if (p.passMark == null) p.passMark = 80; p._normalised = true; return p; }
    const out = {
      title: p.title, meterName: p.meterName, meterIcon: p.meterIcon,
      accent: p.accent, accent2: p.accent2,
      damage: (p.damagePerMiss != null ? p.damagePerMiss : 25),
      timer: (p.timerSeconds != null ? p.timerSeconds : 10),
      passMark: (p.passMark != null ? p.passMark : 80),
      intro: p.intro,
      scenarios: (p.scenarios || []).map(s => ({
        tag: s.tag, from: s.from, text: s.text, media: s.media || null,
        options: (s.options || []).map(o => ({ ic: o.icon, h: o.label, d: o.sub, ok: !!o.correct })),
        why: s.feedback, eo: s.objective
      })),
      ranks: (p.ranks || []).map(r => ({ min: r.minMeter, badge: r.badge, name: r.name, col: r.colour, line: r.line })),
      breached: p.breachedRank || { badge: '✗', name: 'NOT YET', col: '#d23b3b', line: 'Run it again.' }
    };
    out._normalised = true;
    return out;
  }

  _applyAccent() {
    const w = this.$('.nova-decisiondrill__inner')[0];
    if (!w) return;
    if (this.pack.accent) w.style.setProperty('--nova-dd-accent', this.pack.accent);
    if (this.pack.accent2) w.style.setProperty('--nova-dd-accent2', this.pack.accent2);
  }

  _setHUD() {
    const m = Math.max(0, this.state.meter);
    const fill = this.$('.js-nova-dd-meter')[0];
    const pct = this.$('.js-nova-dd-meterpct')[0];
    const sc = this.$('.js-nova-dd-score')[0];
    if (fill) { fill.style.width = m + '%'; fill.setAttribute('data-level', m > 60 ? 'hi' : m > 30 ? 'mid' : 'lo'); }
    if (pct) pct.textContent = m + '%';
    if (sc) sc.textContent = this.state.score;
  }

  _renderBoot() {
    const p = this.pack;
    this.widget.innerHTML =
      '<div class="nova-dd-hud">' +
        '<span class="nova-dd-meterlbl">' + (p.meterIcon || '◆') + ' ' + this._esc(p.meterName || 'Integrity') + '</span>' +
        '<span class="nova-dd-meterpct js-nova-dd-meterpct">100%</span>' +
        '<span class="nova-dd-score js-nova-dd-score">0</span>' +
        '<div class="nova-dd-metertrack"><i class="nova-dd-meterfill js-nova-dd-meter" data-level="hi"></i></div>' +
      '</div>' +
      '<div class="nova-dd-screen nova-dd-boot">' +
        '<div class="nova-dd-badge">' + (p.meterIcon || '◆') + '</div>' +
        '<p class="nova-dd-kicker">Interactive Activity · Decision Drill</p>' +
        '<h3 class="nova-dd-h">' + this._esc(p.title || 'Decision Drill') + '</h3>' +
        '<p class="nova-dd-lead">' + this._esc(p.intro || '') + '</p>' +
        '<button type="button" class="nova-dd-btn js-nova-dd-start">▶ Start</button>' +
      '</div>';
    this._setHUD();
    this.$('.js-nova-dd-start').on('click', () => this._renderRound());
  }

  _startTimer() {
    const t = this.$('.js-nova-dd-timer')[0];
    if (!this.pack.timer) { if (t) t.style.transform = 'scaleX(0)'; return; }
    let left = 100; this.state.t0 = Date.now();
    if (t) t.style.transform = 'scaleX(1)';
    clearInterval(this.state.timer);
    this.state.timer = setInterval(() => {
      left -= 100 / (this.pack.timer * 10);
      if (t) t.style.transform = 'scaleX(' + Math.max(0, left / 100) + ')';
      if (left <= 0) { clearInterval(this.state.timer); if (!this.state.locked) this._decide(null, null); }
    }, 100);
  }

  _renderRound() {
    const s = this.pack.scenarios[this.state.i];
    this.state.locked = false;
    let media = '';
    if (s.media && s.media.type === 'url') {
      media = '<div class="nova-dd-urlbar"><div class="nova-dd-urlt">⚠ inbound link</div><div class="nova-dd-url">' + this._esc(s.media.value) + '</div></div>';
    }
    const opts = s.options.map((o, j) =>
      '<button type="button" class="nova-dd-opt js-nova-dd-opt" data-j="' + j + '">' +
        '<span class="nova-dd-ic">' + (o.ic || '◆') + '</span>' +
        '<span class="nova-dd-otext"><span class="nova-dd-oh">' + this._esc(o.h) + '</span>' +
        (o.d ? '<span class="nova-dd-od">' + this._esc(o.d) + '</span>' : '') + '</span>' +
      '</button>').join('');
    this.widget.innerHTML =
      '<div class="nova-dd-hud">' +
        '<span class="nova-dd-meterlbl">' + (this.pack.meterIcon || '◆') + ' ' + this._esc(this.pack.meterName || 'Integrity') + '</span>' +
        '<span class="nova-dd-meterpct js-nova-dd-meterpct">' + Math.max(0, this.state.meter) + '%</span>' +
        '<span class="nova-dd-score js-nova-dd-score">' + this.state.score + '</span>' +
        '<div class="nova-dd-metertrack"><i class="nova-dd-meterfill js-nova-dd-meter"></i></div>' +
      '</div>' +
      '<div class="nova-dd-timertrack"><i class="nova-dd-timer js-nova-dd-timer"></i></div>' +
      '<div class="nova-dd-screen">' +
        '<p class="nova-dd-kicker">' + (this.state.i + 1) + '/' + this.pack.scenarios.length + ' · ' + this._esc(s.tag || '') + '</p>' +
        '<h3 class="nova-dd-h">What do you do?</h3>' +
        '<div class="nova-dd-evidence"><div class="nova-dd-from">' + this._esc(s.from || '') + '</div>' + this._esc(s.text || '') + '</div>' +
        media +
        '<div class="nova-dd-opts">' + opts + '</div>' +
      '</div>' +
      '<div class="nova-dd-sheet js-nova-dd-sheet">' +
        '<div class="nova-dd-verdict js-nova-dd-verdict"></div>' +
        '<div class="nova-dd-why js-nova-dd-why"></div>' +
        '<div class="nova-dd-eo js-nova-dd-eo"></div>' +
        '<button type="button" class="nova-dd-btn js-nova-dd-next"></button>' +
      '</div>';
    this._setHUD();
    this.$('.js-nova-dd-opt').on('click', e => {
      const b = e.currentTarget;
      this._decide(parseInt(b.getAttribute('data-j'), 10), b);
    });
    this._startTimer();
  }

  _decide(j, el) {
    if (this.state.locked) return;
    this.state.locked = true;
    clearInterval(this.state.timer);
    const s = this.pack.scenarios[this.state.i];
    const right = j !== null && s.options[j].ok;
    const ci = s.options.findIndex(o => o.ok);
    this.$('.js-nova-dd-opt').each((k, b) => {
      b.classList.add('is-dim');
      if (k === ci) b.classList.add('is-correct');
      if (el && k === j && !right) b.classList.add('is-wrong');
    });
    const verdict = this.$('.js-nova-dd-verdict')[0];
    if (right) {
      const speed = this.pack.timer ? Math.max(0, (Date.now() - this.state.t0) / 1000) : 0;
      const pts = Math.round(100 + Math.max(0, (this.pack.timer - speed)) * 15);
      this.state.score += pts; this.state.streak++; this.state.clean++;
      this.state.best = Math.max(this.state.best, this.state.streak);
      verdict.className = 'nova-dd-verdict js-nova-dd-verdict is-w';
      verdict.innerHTML = (this.state.streak >= 3 ? 'On point ✅ ' : 'Correct ✅ ') + '<span class="nova-dd-pts">+' + pts + (this.state.streak >= 3 ? ' · ' + this.state.streak + ' streak' : '') + '</span>';
    } else {
      this.state.meter -= this.pack.damage; this.state.streak = 0;
      verdict.className = 'nova-dd-verdict js-nova-dd-verdict is-l';
      verdict.innerHTML = j === null ? 'Too slow ⏱' : 'Not the move ✗';
    }
    this._setHUD();
    this.$('.js-nova-dd-why')[0].innerHTML = s.why || '';
    this.$('.js-nova-dd-eo')[0].textContent = s.eo ? ('Objective · ' + s.eo) : '';
    const breached = this.state.meter <= 0;
    const last = this.state.i === this.pack.scenarios.length - 1;
    const next = this.$('.js-nova-dd-next')[0];
    next.textContent = (breached || last) ? 'See result ▸' : 'Next ▸';
    next.onclick = () => {
      this.$('.js-nova-dd-sheet').removeClass('is-up');
      this.state.i++;
      if (breached || last) this._results(breached); else this._renderRound();
    };
    this.$('.js-nova-dd-sheet').addClass('is-up');
  }

  _results(breached) {
    const p = this.pack;
    let r = breached ? p.breached : (p.ranks.find(x => this.state.meter >= x.min) || p.ranks[p.ranks.length - 1]);
    const pct = Math.round(this.state.clean / p.scenarios.length * 100);
    const passed = !breached && pct >= (p.passMark || 80);
    this.widget.innerHTML =
      '<div class="nova-dd-screen nova-dd-result">' +
        '<div class="nova-dd-badge">' + (r.badge || '◆') + '</div>' +
        '<div class="nova-dd-rank" style="color:' + (r.col || '') + ';border-color:' + (r.col || '') + '">' + this._esc(r.name || '') + '</div>' +
        '<p class="nova-dd-lead">' + this._esc(r.line || '') + '</p>' +
        '<div class="nova-dd-stats">' +
          '<div class="nova-dd-stat"><span class="k">' + (p.meterIcon || '◆') + ' ' + this._esc(p.meterName || '') + '</span><span class="v">' + Math.max(0, this.state.meter) + '%</span></div>' +
          '<div class="nova-dd-stat"><span class="k">Score</span><span class="v">' + this.state.score + '</span></div>' +
          '<div class="nova-dd-stat"><span class="k">Correct</span><span class="v">' + this.state.clean + '/' + p.scenarios.length + '</span></div>' +
          '<div class="nova-dd-stat"><span class="k">Best streak</span><span class="v">' + this.state.best + '</span></div>' +
        '</div>' +
        '<button type="button" class="nova-dd-btn js-nova-dd-again">↻ Run it back</button>' +
      '</div>';
    this.$('.js-nova-dd-again').on('click', () => {
      this.state = { i: 0, score: 0, meter: 100, streak: 0, best: 0, clean: 0, locked: false, timer: null, t0: 0 };
      this._renderBoot();
    });
    // ---- report to Adapt → spoor → SCORM ----
    this.model.set('_score', pct);
    this.model.set('_attemptScore', pct);
    if (passed || breached) this.setCompletionStatus();   // content completion → SCORM tracked
  }

  _esc(v) {
    return String(v == null ? '' : v)
      .replace(/&(?!#?\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  remove() {
    if (this.state && this.state.timer) clearInterval(this.state.timer);
    super.remove();
  }
}

NovaDecisionDrillView.template = 'decisiondrill';

export default components.register('nova-decisiondrill', {
  model: NovaDecisionDrillModel,
  view: NovaDecisionDrillView
});
