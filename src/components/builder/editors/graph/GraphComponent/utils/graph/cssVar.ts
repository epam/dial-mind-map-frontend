export type GraphCssVars = {
  nodeText: string;
  nodeBackground: string;
  edgeColor: string;
  rootNodeBackground: string;
  reviewRequiredBorder: string;
  reviewedBorder: string;
  focusedBorder: string;
};

const DEFAULTS_CSS_VARS: GraphCssVars = {
  nodeText: '#F3F4F6',
  nodeBackground: '#141a23',
  edgeColor: '#424952',
  rootNodeBackground: '#7F8792',
  reviewRequiredBorder: '#F4CE46',
  reviewedBorder: '#37BABC',
  focusedBorder: '#5c8dea',
};

function readVar(name: string, fallback: string) {
  if (typeof window === 'undefined' || !window.getComputedStyle) return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function readGraphCssVars(): GraphCssVars {
  return {
    nodeText: readVar('--text-primary', DEFAULTS_CSS_VARS.nodeText),
    nodeBackground: readVar('--bg-layer-3', DEFAULTS_CSS_VARS.nodeBackground),
    edgeColor: readVar('--stroke-primary', DEFAULTS_CSS_VARS.edgeColor),
    rootNodeBackground: readVar('--bg-layer-4', DEFAULTS_CSS_VARS.rootNodeBackground),
    reviewRequiredBorder: readVar('--stroke-warning', DEFAULTS_CSS_VARS.reviewRequiredBorder),
    reviewedBorder: readVar('--stroke-success', DEFAULTS_CSS_VARS.reviewedBorder),
    focusedBorder: readVar('--stroke-accent-primary', DEFAULTS_CSS_VARS.focusedBorder),
  };
}
