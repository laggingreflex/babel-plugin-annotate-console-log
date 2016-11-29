class Foo {
  bar() {
    custom('Foo->bar()', 'a');
  }
}

const Baz = class {
  qux() {
    custom.log('Baz->qux()', 'a');
  }
};
