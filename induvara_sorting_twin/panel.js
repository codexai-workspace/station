(() => {
  const panel = document.getElementById('control-panel');
  const open = document.getElementById('panel-open');
  const close = document.getElementById('panel-close');
  function setCollapsed(collapsed) {
    panel.hidden = collapsed;
    open.hidden = !collapsed;
    open.setAttribute('aria-expanded', String(!collapsed));
    close.setAttribute('aria-expanded', String(!collapsed));
    (collapsed ? open : close).focus();
  }
  close.addEventListener('click', () => setCollapsed(true));
  open.addEventListener('click', () => setCollapsed(false));
})();
