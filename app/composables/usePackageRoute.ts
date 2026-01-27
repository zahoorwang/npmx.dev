export function parsePackageRouteParams(pkg: string) {
  const [org, name] = pkg.startsWith('@') ? pkg.split('/') : [null, pkg]

  return { org, name }
}
