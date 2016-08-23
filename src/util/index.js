function noop () {}

function merge (target, ...list) {
	for (let i = 0, l = list.length; i < l; i++) {
		for (let item in list[i]) {
			target[item] = list[i][item]
		}
	}
	return target;
}

function thenable(p) {
  return p && typeof p.then === 'function';
}
export {
	noop,
	merge,
  thenable
}