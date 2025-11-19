import { Router } from "express";
import {
  listAuthors,
  getAuthor,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  getAuthorBooks,
} from "../controllers/authors.controller";

const router = Router();

router.get("/", listAuthors);
router.get("/:id", getAuthor);
router.get("/:id/books", getAuthorBooks);
router.post("/", createAuthor);
router.put("/:id", updateAuthor);
router.delete("/:id", deleteAuthor);

export default router;
