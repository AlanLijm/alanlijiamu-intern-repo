const userName = "Alan";

function calculateTax(price: number): number {
  return price * 0.0825;
}

function greet(name: string | null): string {
  if (name == null) {
    return "Hello, stranger";
  } else {
    return `Hello, ${name}`;
  }
}
console.log(userName, calculateTax(100), greet(userName));
