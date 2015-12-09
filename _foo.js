var utils = require('utils');
var assert = require('assert');

describe('foo', function () {
	function fooHelper() {
		// do stuff.
	}

	it('foo-test1', function () {
		fooHelper();
	});

	it('foo-test2', function () {
		fooHelper();
	});
});

describe('bar', function () {
	function barHelper() {
		// do stuff.
	}

	it('bar-test1', function () {
		barHelper();
	});
});
