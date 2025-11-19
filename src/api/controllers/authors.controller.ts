import { Request, Response, NextFunction } from "express";
import { prisma } from "../../db/client";
import { ApiError } from "../middleware/error-handler";

export const listAuthors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { bio: { contains: search as string } },
      ];
    }

    const authors = await prisma.author.findMany({
      where,
      include: {
        books: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(authors);
  } catch (error) {
    next(error);
  }
};

export const getAuthor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const author = await prisma.author.findUnique({
      where: { id: parseInt(id) },
      include: {
        books: true,
      },
    });

    if (!author) {
      throw new ApiError(404, "Author not found");
    }

    res.json(author);
  } catch (error) {
    next(error);
  }
};

export const createAuthor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, bio } = req.body;

    if (!name) {
      throw new ApiError(400, "Name is required");
    }

    const author = await prisma.author.create({
      data: {
        name,
        bio,
      },
      include: {
        books: true,
      },
    });

    res.status(201).json(author);
  } catch (error) {
    next(error);
  }
};

export const updateAuthor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, bio } = req.body;

    const author = await prisma.author.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
      },
      include: {
        books: true,
      },
    });

    res.json(author);
  } catch (error) {
    next(error);
  }
};

export const deleteAuthor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.author.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getAuthorBooks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const author = await prisma.author.findUnique({
      where: { id: parseInt(id) },
      include: {
        books: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!author) {
      throw new ApiError(404, "Author not found");
    }

    res.json(author.books);
  } catch (error) {
    next(error);
  }
};
