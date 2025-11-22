const fs = require("fs");
const pkgPath = "./package.json";
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

function pin(obj) {
  if (!obj) return {};
  for (const k of Object.keys(obj)) {
    obj[k] = String(obj[k]).replace(/^[\^~]/, ""); // ba?taki ^ veya ~ kald?r
  }
  return obj;
}

pkg.dependencies = pin(pkg.dependencies);
pkg.devDependencies = pin(pkg.devDependencies);

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("? package.json versions pinned.");
