'use strict';

var fs = require('fs');
var Path = require('path');
var recast = require('recast');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

var outputDir = Path.join(__dirname, 'output');

rimraf.sync(outputDir);
mkdirp.sync(outputDir);

var types = recast.types;
var n = types.namedTypes;

var inputPath = Path.join(__dirname, '_foo.js');

var inputSource = fs.readFileSync(inputPath, 'utf8');

var ast = recast.parse(inputSource);

var i = 0;

types.visit(ast, {
	visitExpressionStatement: function (path) {
		var node = path.node;
		if (isIt(node)) {
			var code = recast.print(rootNode(copy(path))).code;
			var fileName = i + '-' + name(path).replace(/\s/g, '_') + '.js';
			if (i < 100) {
				fileName = (i < 10 ? '00' : '0') + fileName;
			}
			fs.writeFileSync(Path.join(outputDir, fileName), code);
			i++;
			return false;
		}
		this.traverse(path);
	}
});

function copy(path) {
	var copied;
	if (path.parentPath) {
		copied = copy(path.parentPath).get(path.name);
	} else {
		copied = new types.NodePath({root: recast.parse(inputSource)});
	}

	var parent = copied.parent;
	var node = copied.value;
	if (!(n.Node.check(node) && parent && (n.BlockStatement.check(parent.node) || n.Program.check(parent.node)))) {
		return copied;
	}

	var body = parent.get('body').value;
	var keeper = parent.get('body', path.name).node;

	var statementIdx = 0;

	while (statementIdx < body.length) {
		var statement = body[statementIdx];
		if ((isDescribe(statement) || isIt(statement)) && statement !== keeper) {
			parent.get('body', statementIdx).replace();
		} else {
			statementIdx++;
		}
	}

	return copied;
}

function isDescribe(node) {
	if (!n.ExpressionStatement.check(node)) {
		return false;
	}
	node = node.expression;
	return n.CallExpression.check(node) && n.Identifier.check(node.callee) && (node.callee.name === 'describe');
}

function isIt(node) {
	if (!n.ExpressionStatement.check(node)) {
		return false;
	}
	node = node.expression;
	return n.CallExpression.check(node) && n.Identifier.check(node.callee) && (node.callee.name === 'it');
}

// Walks the path up to the root.
function rootNode(path) {
	while (path.parent) {
		path = path.parent;
	}
	return path;
}

// Picks a file name for the test, by walking up the tree and looking at describe / require calls.
function name(path) {
	var arr = [];
	_name(path, arr);
	return arr.reverse().join(' ');
}

function _name(path, arr) {
	if (!path) {
		return;
	}
	if (isDescribe(path.node) || isIt(path.node)) {
		var firstArg = path.get('expression', 'arguments', 0).node;
		n.Literal.assert(firstArg);
		arr.push(firstArg.value);
	}
	_name(path.parent, arr);
}
