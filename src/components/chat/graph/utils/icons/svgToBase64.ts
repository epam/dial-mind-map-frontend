export function svgToBase64(svg: string) {
  return 'data:image/svg+xml;base64,' + btoa(svg);
}
