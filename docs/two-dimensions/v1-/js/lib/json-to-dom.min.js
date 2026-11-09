//#region src/v42/register/meta.js
var e = {
	version: "42.1.4",
	name: "json-to-dom"
}, t = (t) => {
	t && (globalThis.ks ??= {}, globalThis.ks.jsonToDom = {
		meta: e,
		appendToDom: t
	});
}, n = {
	version: "v12",
	description: "JSON-to-DOM engine powered by decoupled external-action traversal engine"
}, r = (e) => {
	if (typeof globalThis > "u" || !e) return;
	globalThis.ks ??= {};
	let t = typeof e == "function" ? e : e.buildSpecElement, r = e.buildSpecElementWithValidate, i = {
		meta: n,
		buildSpecElement: t,
		...r ? { buildSpecElementWithValidate: r } : {}
	};
	globalThis.ks["json-to-tag"] = i, globalThis.ks.jsonToTag = i;
}, i = ({ inItems: e, inFunc: t }) => {
	let n = e, r = t;
	return Array.isArray(n) ? n.map((e) => o({
		inSpec: e,
		inFunc: r
	})).flat(Infinity).filter(Boolean) : [];
}, a = ({ inSpec: e, inFunc: t }) => {
	let n = e, r = t;
	if (!n || typeof n != "object" || Array.isArray(n)) return null;
	let a = typeof r == "function" ? r(n) : null;
	if (Array.isArray(n.children)) {
		let e = i({
			inItems: n.children,
			inFunc: r
		});
		if (a && typeof a.append == "function" && Array.isArray(e)) {
			let t = e.filter(Boolean);
			t.length && a.append(...t);
		}
	}
	return a;
}, o = ({ inSpec: e, inFunc: t }) => {
	let n = e, r = t;
	return n == null ? null : typeof Node < "u" && n instanceof Node ? n : Array.isArray(n) ? i({
		inItems: n,
		inFunc: r
	}) : typeof n == "object" ? a({
		inSpec: n,
		inFunc: r
	}) : typeof n == "string" || typeof n == "number" ? typeof document < "u" ? document.createTextNode(String(n)) : String(n) : null;
}, s = ({ inNode: e, inErrors: t }) => {
	let n = e, r = t;
	return !n || typeof n != "object" || Array.isArray(n) ? (r.push({ reason: "Node must be a plain object" }), !1) : !0;
}, c = ({ inNode: e, inCatalog: t, inErrors: n }) => {
	let r = e, i = t, a = n, o = r.tagName;
	return !o || typeof o != "string" || o.trim() === "" ? (a.push({ reason: "Missing or empty 'tagName'" }), !1) : i && typeof i == "object" && !(i[o] || Object.keys(i).includes(o)) ? (a.push({
		tagName: o,
		reason: `Unrecognized tagName '${o}' not found in spec catalog`
	}), !1) : !0;
}, l = ({ inNode: e, inCatalog: t, inErrors: n }) => {
	let r = e, i = t, a = n, o = r.tagName, s = i ? i[o] : null;
	return s && s.allowsTextContent === !1 && r.textContent ? (a.push({
		tagName: o,
		reason: `Tag '${o}' does not allow direct textContent`
	}), !1) : !0;
}, u = ({ inNode: e, inCatalog: t, inErrors: n }) => {
	let r = e, i = t, a = n, o = r.tagName, s = i ? i[o] : null;
	return s && s.allowsChildren === !1 && Array.isArray(r.children) && r.children.length > 0 ? (a.push({
		tagName: o,
		reason: `Tag '${o}' does not allow children (void element)`
	}), !1) : "children" in r && !Array.isArray(r.children) ? (a.push({
		tagName: o,
		reason: "'children' must be an array"
	}), !1) : !0;
}, d = ({ inNode: e, inCatalog: t, inErrors: n }) => {
	let r = e, i = t, a = n, o = r.tagName, s = i ? i[o] : null;
	return s && Array.isArray(s.childTags) && s.childTags.length > 0 && Array.isArray(r.children) && r.children.forEach((e) => {
		e && e.tagName && !s.childTags.includes(e.tagName) && a.push({
			tagName: e.tagName,
			reason: `Tag '${e.tagName}' is not an allowed child of '${o}' (allowed: ${s.childTags.join(", ")})`
		});
	}), !0;
}, f = ({ inNode: e, inErrors: t }) => {
	let n = e, r = t, i = n.tagName;
	return "attributes" in n && (!n.attributes || typeof n.attributes != "object" || Array.isArray(n.attributes)) ? (r.push({
		tagName: i,
		reason: "'attributes' must be a key-value object"
	}), !1) : !0;
}, p = ({ inNode: e, inCatalog: t, inErrors: n }) => {
	let r = e, i = t, a = n;
	s({
		inNode: r,
		inErrors: a
	}) && (c({
		inNode: r,
		inCatalog: i,
		inErrors: a
	}), l({
		inNode: r,
		inCatalog: i,
		inErrors: a
	}), u({
		inNode: r,
		inCatalog: i,
		inErrors: a
	}), d({
		inNode: r,
		inCatalog: i,
		inErrors: a
	}), f({
		inNode: r,
		inErrors: a
	}));
}, m = {
	$schema: "./tags.schema.json",
	div: {
		allowsTextContent: !1,
		allowsChildren: !0,
		allowedAttributes: ["title", "role"],
		childTags: []
	},
	input: {
		allowsTextContent: !1,
		allowsChildren: !1,
		allowedAttributes: [
			"type",
			"placeholder",
			"value",
			"name",
			"disabled",
			"readonly",
			"required",
			"list"
		]
	},
	checkbox: {
		allowsTextContent: !1,
		allowsChildren: !1,
		allowedAttributes: [
			"type",
			"checked",
			"name",
			"value",
			"disabled",
			"required"
		]
	},
	colgroup: {
		allowsTextContent: !1,
		allowsChildren: !0,
		allowedAttributes: ["span"],
		childTags: ["col"]
	},
	col: {
		allowsTextContent: !1,
		allowsChildren: !1,
		allowedAttributes: [
			"span",
			"style",
			"width"
		]
	},
	label: {
		allowsTextContent: !0,
		allowsChildren: !0,
		allowedAttributes: ["for"],
		childTags: []
	},
	form: {
		allowsTextContent: !1,
		allowsChildren: !0,
		allowedAttributes: [
			"action",
			"method",
			"autocomplete",
			"enctype",
			"name",
			"novalidate",
			"target"
		],
		childTags: []
	},
	select: {
		allowsTextContent: !1,
		allowsChildren: !0,
		allowedAttributes: [
			"name",
			"disabled",
			"required",
			"multiple",
			"size"
		],
		childTags: ["option"]
	},
	p: {
		allowsTextContent: !0,
		allowsChildren: !0,
		allowedAttributes: [],
		childTags: []
	},
	h1: {
		allowsTextContent: !0,
		allowsChildren: !0,
		allowedAttributes: [],
		childTags: []
	},
	h2: {
		allowsTextContent: !0,
		allowsChildren: !0,
		allowedAttributes: [],
		childTags: []
	},
	span: {
		allowsTextContent: !0,
		allowsChildren: !0,
		allowedAttributes: [],
		childTags: []
	},
	img: {
		allowsTextContent: !1,
		allowsChildren: !1,
		allowedAttributes: [
			"src",
			"alt",
			"width",
			"height",
			"loading"
		]
	},
	button: {
		allowsTextContent: !0,
		allowsChildren: !0,
		allowedAttributes: [
			"type",
			"disabled",
			"name",
			"value"
		],
		childTags: []
	},
	table: {
		allowsTextContent: !1,
		allowsChildren: !0,
		allowedAttributes: [
			"border",
			"cellpadding",
			"cellspacing"
		],
		childTags: [
			"caption",
			"colgroup",
			"thead",
			"tbody",
			"tfoot",
			"tr"
		]
	},
	thead: {
		allowsTextContent: !1,
		allowsChildren: !0,
		allowedAttributes: [],
		childTags: ["tr"]
	},
	tbody: {
		allowsTextContent: !1,
		allowsChildren: !0,
		allowedAttributes: [],
		childTags: ["tr"]
	},
	tfoot: {
		allowsTextContent: !1,
		allowsChildren: !0,
		allowedAttributes: [],
		childTags: ["tr"]
	},
	tr: {
		allowsTextContent: !1,
		allowsChildren: !0,
		allowedAttributes: [],
		childTags: ["td", "th"]
	},
	th: {
		allowsTextContent: !0,
		allowsChildren: !0,
		allowedAttributes: [
			"scope",
			"colspan",
			"rowspan"
		],
		childTags: []
	},
	td: {
		allowsTextContent: !0,
		allowsChildren: !0,
		allowedAttributes: ["colspan", "rowspan"],
		childTags: []
	},
	datalist: {
		allowsTextContent: !1,
		allowsChildren: !0,
		allowedAttributes: [],
		childTags: ["option"]
	},
	option: {
		allowsTextContent: !0,
		allowsChildren: !1,
		allowedAttributes: [
			"value",
			"label",
			"selected",
			"disabled"
		]
	},
	header: {
		allowsTextContent: !1,
		allowsChildren: !0,
		allowedAttributes: ["role"],
		childTags: []
	},
	a: {
		allowsTextContent: !0,
		allowsChildren: !0,
		allowedAttributes: [
			"href",
			"target",
			"rel",
			"title",
			"download"
		],
		childTags: []
	},
	i: {
		allowsTextContent: !0,
		allowsChildren: !0,
		allowedAttributes: ["aria-hidden"],
		childTags: []
	},
	small: {
		allowsTextContent: !0,
		allowsChildren: !0,
		allowedAttributes: [],
		childTags: []
	},
	ul: {
		allowsTextContent: !1,
		allowsChildren: !0,
		allowedAttributes: ["type"],
		childTags: ["li"]
	},
	li: {
		allowsTextContent: !0,
		allowsChildren: !0,
		allowedAttributes: ["value"],
		childTags: []
	},
	hr: {
		allowsTextContent: !1,
		allowsChildren: !1,
		allowedAttributes: []
	}
};
//#endregion
//#region ../json-to-tag-validate/src/v4/index.js
function h({ inJson: e, inCatalog: t, inSpec: n }) {
	let r = e, i = t ?? n ?? m, a = [];
	return o({
		inSpec: r,
		inFunc: (e) => {
			p({
				inNode: e,
				inCatalog: i,
				inErrors: a
			});
		}
	}), {
		isValid: a.length === 0,
		errors: a
	};
}
//#endregion
//#region ../json-to-tag/src/v12/element/createElement.js
var g = "http://www.w3.org/2000/svg", _ = /* @__PURE__ */ new Set(/* @__PURE__ */ "svg.path.symbol.use.g.circle.ellipse.rect.line.polyline.polygon.text.tspan.defs.clippath.mask.pattern.marker.lineargradient.radialgradient.stop.image.filter.fegaussianblur.femerge.femergenode".split(".")), v = ({ inTagName: e }) => {
	let t = e?.toLowerCase();
	if (!t) return null;
	if (t === "checkbox") {
		let e = document.createElement("input");
		return e.type = "checkbox", e;
	}
	return _.has(t) ? document.createElementNS(g, t) : document.createElement(t);
}, y = ({ inElement: e, inTextContent: t }) => (!e || t == null || (e.textContent = t), e), b = ({ inElement: e, inProperties: t }) => (e && t && typeof t == "object" && Object.assign(e, t), e), x = "http://www.w3.org/1999/xlink", S = ({ inElement: e, inAttributes: t }) => {
	let n = e, r = t;
	if (!n || !r || typeof r != "object") return n;
	let i = typeof SVGElement < "u" ? n instanceof SVGElement : n.namespaceURI === "http://www.w3.org/2000/svg";
	return Object.entries(r).forEach(([e, t]) => {
		if (e === "class") {
			i ? n.setAttribute("class", String(t)) : n.className = t;
			return;
		}
		if (e === "xlink:href" || e === "href") {
			if (t != null) {
				let e = String(t);
				if (i) try {
					n.setAttributeNS(x, "href", e);
				} catch {}
				n.setAttribute("href", e), n.setAttribute("xlink:href", e);
			}
			return;
		}
		if (typeof t == "boolean") {
			t ? n.setAttribute(e, "") : n.removeAttribute(e);
			return;
		}
		t != null && n.setAttribute(e, String(t));
	}), n;
}, C = ({ inElement: e, inClassList: t }) => {
	if (!e || !t) return e;
	let n = typeof t == "string" ? t.split(/\s+/).filter(Boolean) : Array.isArray(t) ? t.filter((e) => typeof e == "string" && e.trim()) : [];
	return n.length && e.classList.add(...n), e;
}, w = (e) => {
	if (!e || typeof e != "object" || Array.isArray(e) || !e.tagName) return null;
	let t = v({ inTagName: e.tagName });
	return t ? (y({
		inElement: t,
		inTextContent: e.textContent,
		inTagName: e.tagName
	}), b({
		inElement: t,
		inProperties: e.properties
	}), S({
		inElement: t,
		inAttributes: e.attributes
	}), C({
		inElement: t,
		inClassList: e.classList
	}), t) : null;
}, T = (e = {}) => o({
	inSpec: e?.spec ?? e?.inSpec ?? e,
	inFunc: w
});
r({
	buildSpecElement: T,
	buildSpecElementWithValidate: (e = {}) => {
		let t = e?.spec ?? e?.inSpec ?? e, n = h({ inJson: t });
		return n.isValid || console.warn("[json-to-tag] Specification validation issues:", n.errors), o({
			inSpec: t,
			inFunc: w
		});
	}
});
//#endregion
//#region node_modules/spec-to-dom/src/v2/register/meta.js
var E = {
	version: "2.1.1",
	name: "spec-to-dom"
}, D = (e) => {
	e && (globalThis.ks ??= {}, globalThis.ks.specToDom = {
		meta: E,
		appendToDom: e
	});
}, O = ({ buildSpec: e, targetHtmlId: t, appendPosition: n, showLog: r }) => {
	let i = e, a = t, o = n, s = r;
	s && console.log("renderToDom 1 (content):", i);
	let c = document.getElementById(a);
	return c ? (Array.isArray(i) || i instanceof NodeList || i instanceof HTMLCollection ? o === "prepend" ? c.prepend(...i) : c.append(...i) : o === "prepend" ? c.prepend(i) : (c.innerHTML = "", c.append(i)), s && console.log("renderToDom 2 (mounted):", c), c) : null;
};
D(O);
//#endregion
//#region src/v42/index.js
var k = ({ jsonSpec: e, targetHtmlId: t, appendPosition: n, showLog: r }) => O({
	buildSpec: T(e),
	targetHtmlId: t,
	appendPosition: n,
	showLog: r
});
t(k);
//#endregion
export { k as default };
