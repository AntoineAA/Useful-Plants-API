exports.get_date = function (aaaammjj) {
	if (!/^(\d){8}$/.test(aaaammjj)) {
		return null;
	}
	var y = aaaammjj.substr(0,4);
	var m = aaaammjj.substr(4,2);
	var d = aaaammjj.substr(6,2);
	return new Date(y,m,d);
}