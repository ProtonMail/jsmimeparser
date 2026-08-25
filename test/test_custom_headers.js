
import { assert } from "vitest";
import { headeremitter, headerparser } from "../lib/jsmime";

describe("Custom decoder support", function() {
  function customDecoder(values) {
    let value = values.join("");
    return atob(value);
  }
  function customEncoder(value) {
    this.addText(btoa(value), true);
  }
  it("addStructuredEncoder", function() {
    assert.equal(
      "X-Base64: String\r\n",
      headeremitter.emitStructuredHeader("X-Base64", "String", {})
    );
    headeremitter.addStructuredEncoder("X-Base64", customEncoder);
    assert.equal(
      "X-Base64: U3RyaW5n\r\n",
      headeremitter.emitStructuredHeader("X-Base64", "String", {})
    );
    assert.equal(
      "X-Base64: U3RyaW5n\r\n",
      headeremitter.emitStructuredHeader("x-bASe64", "String", {})
    );
  });
  it("addStructuredDecoder", function() {
    assert.throws(function() {
      headerparser.parseStructuredHeader("X-Base64", "U3RyaW5n");
    }, /Unknown structured header/);
    headerparser.addStructuredDecoder("X-Base64", customDecoder);
    assert.equal(
      "String",
      headerparser.parseStructuredHeader("X-Base64", "U3RyaW5n")
    );
    assert.throws(function() {
      headerparser.addStructuredDecoder("To", customDecoder);
    }, /Cannot override header/);
  });
});
