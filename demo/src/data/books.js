export const books = [
  {
    id: 1,
    title: "Clean Code",
    authorId: 1,
    year: 2008,
    genre: "Programming",
    description: "A Handbook of Agile Software Craftsmanship",
    isbn: "978-0132350884",
    pages: 464
  },
  {
    id: 2,
    title: "The Pragmatic Programmer",
    authorId: 2,
    year: 1999,
    genre: "Programming",
    description: "Your Journey to Mastery",
    isbn: "978-0201616224",
    pages: 352
  },
  {
    id: 3,
    title: "Design Patterns",
    authorId: 3,
    year: 1994,
    genre: "Programming",
    description: "Elements of Reusable Object-Oriented Software",
    isbn: "978-0201633610",
    pages: 416
  },
  {
    id: 4,
    title: "Refactoring",
    authorId: 4,
    year: 1999,
    genre: "Programming",
    description: "Improving the Design of Existing Code",
    isbn: "978-0201485677",
    pages: 464
  },
  {
    id: 5,
    title: "Domain-Driven Design",
    authorId: 5,
    year: 2003,
    genre: "Software Architecture",
    description: "Tackling Complexity in the Heart of Software",
    isbn: "978-0321125217",
    pages: 560
  }
];

let nextId = 6;

export function getAllBooks() {
  return books;
}

export function getBookById(id) {
  return books.find(book => book.id === parseInt(id));
}

export function getBooksByAuthor(authorId) {
  return books.filter(book => book.authorId === parseInt(authorId));
}

export function createBook(bookData) {
  const newBook = {
    id: nextId++,
    ...bookData
  };
  books.push(newBook);
  return newBook;
}

export function updateBook(id, bookData) {
  const index = books.findIndex(book => book.id === parseInt(id));
  if (index === -1) return null;
  
  books[index] = { ...books[index], ...bookData };
  return books[index];
}

export function deleteBook(id) {
  const index = books.findIndex(book => book.id === parseInt(id));
  if (index === -1) return false;
  
  books.splice(index, 1);
  return true;
}
