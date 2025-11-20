export const authors = [
  {
    id: 1,
    name: "Robert C. Martin",
    country: "USA",
    birthYear: 1952,
    bio: "Software engineer and author, known as Uncle Bob",
    website: "http://cleancoder.com"
  },
  {
    id: 2,
    name: "Andrew Hunt",
    country: "USA",
    birthYear: 1964,
    bio: "Co-author of The Pragmatic Programmer",
    website: "https://pragprog.com"
  },
  {
    id: 3,
    name: "Erich Gamma",
    country: "Switzerland",
    birthYear: 1961,
    bio: "One of the Gang of Four, co-author of Design Patterns",
    website: null
  },
  {
    id: 4,
    name: "Martin Fowler",
    country: "UK",
    birthYear: 1963,
    bio: "Software developer, author, and speaker on software design",
    website: "https://martinfowler.com"
  },
  {
    id: 5,
    name: "Eric Evans",
    country: "USA",
    birthYear: 1960,
    bio: "Software designer and author of Domain-Driven Design",
    website: "https://domainlanguage.com"
  }
];

let nextId = 6;

export function getAllAuthors() {
  return authors;
}

export function getAuthorById(id) {
  return authors.find(author => author.id === parseInt(id));
}

export function createAuthor(authorData) {
  const newAuthor = {
    id: nextId++,
    ...authorData
  };
  authors.push(newAuthor);
  return newAuthor;
}

export function updateAuthor(id, authorData) {
  const index = authors.findIndex(author => author.id === parseInt(id));
  if (index === -1) return null;
  
  authors[index] = { ...authors[index], ...authorData };
  return authors[index];
}

export function deleteAuthor(id) {
  const index = authors.findIndex(author => author.id === parseInt(id));
  if (index === -1) return false;
  
  authors.splice(index, 1);
  return true;
}
