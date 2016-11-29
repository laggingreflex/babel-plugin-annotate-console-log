class Foo {
  bar() {
    custom('a');
  }
}

const Baz = class {
  qux() {
    custom.log('a');
  }
};
