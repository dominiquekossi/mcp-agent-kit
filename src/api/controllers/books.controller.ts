import { Request, Response, NextFunction } from "express";
import { prisma } from "../../db/client";
import { ApiError } from "../middleware/error-handler";

export const listBooks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { authorId, search } = req.query;

    const where: any = {};

    if (authorId) {
      where.authorId = parseInt(authorId as string);
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    const books = await prisma.book.findMany({
      where,
      include: {
        author: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(books);
  } catch (error) {
    next(error);
  }
};

export const getBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: true,
      },
    });

    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    res.json(book);
  } catch (error) {
    next(error);
  }
};

export const createBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, publishedYear, authorId } = req.body;

    if (!title || !authorId) {
      throw new ApiError(400, "Title and authorId are required");
    }

    const book = await prisma.book.create({
      data: {
        title,
        description,
        publishedYear,
        authorId,
      },
      include: {
        author: true,
      },
    });

    res.status(201).json(book);
  } catch (error) {
    next(error);
  }
};

export const updateBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title, description, publishedYear, authorId } = req.body;

    const book = await prisma.book.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(publishedYear !== undefined && { publishedYear }),
        ...(authorId && { authorId }),
      },
      include: {
        author: true,
      },
    });

    res.json(book);
  } catch (error) {
    next(error);
  }
};

export const deleteBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.book.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
