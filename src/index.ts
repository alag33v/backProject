import express, { Request, Response } from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

app.use(bodyParser.json());

enum VideoQuality {
  P144 = "144p",
  P240 = "240p",
  P360 = "360p",
  P480 = "480p",
  P720 = "720p",
  P1080 = "1080p",
  P1440 = "1440p",
  P2160 = "2160p",
}

type VideoType = {
  id: number;
  title: string;
  author: string;
  canBeDownloaded: boolean;
  minAgeRestriction?: number | null;
  createdAt: string;
  publicationDate?: string;
  availableResolutions?: VideoQuality[];
};

type ValidationRule = {
  fieldName: string;
  isRequired?: boolean;
  minLength?: number;
  maxLength?: number;
  isString?: boolean;
  isArray?: boolean;
  enumValues?: string[];
}

const videos: VideoType[] = [];

const validateField = (value: any, rules: ValidationRule): string | null => {
  const { fieldName, isRequired, maxLength, minLength, isString, isArray, enumValues } = rules;

  if (isRequired && (value === undefined || value === null)) {
    return `${fieldName} is required.`;
  }

  if (isString) {
    if (typeof value !== 'string') {
      return `${fieldName} must be a string.`;
    }

    if (minLength !== undefined && value.length < minLength) {
      return `Invalid ${fieldName} length (minimum ${minLength} characters).`;
    }

    if (maxLength !== undefined && value.length > maxLength) {
      return `Invalid ${fieldName} length (maximum ${maxLength} characters).`;
    }
  }

  if (isArray && !Array.isArray(value)) {
    return `${fieldName} must be an array.`;
  }

  if (enumValues && isArray) {
    for (const item of value) {
      if (!enumValues.includes(item)) {
        return `Invalid ${fieldName}: ${item}`;
      }
    }
  }

  return null;
};

const validateVideoInput = (req: Request): string[] => {
  const validationRules: ValidationRule[] = [
    { fieldName: 'title', isRequired: true, isString: true, minLength: 1, maxLength: 40 },
    { fieldName: 'author', isRequired: true, isString: true, minLength: 1, maxLength: 20 },
    { fieldName: 'availableResolutions', isArray: true, isRequired: true, enumValues: Object.values(VideoQuality) },
  ];

  const errors: string[] = [];

  for (const rule of validationRules) {
    const validationError = validateField(req.body[rule.fieldName], rule);
    if (validationError) {
      errors.push(validationError);
    }
  }

  return errors;
};

app.get("/videos", (req: Request, res: Response) => {
  res.send(videos);
});

app.get("/videos/:id", (req: Request, res: Response) => {
  const videoIndex = videos.findIndex((video) => video.id === +req.params.id);

  if (videoIndex !== -1) {
    return res.send(videos[videoIndex]);
  } else {
    return res.send(404);
  }
});

app.post("/videos", (req: Request, res: Response) => {
  const validationErrors = validateVideoInput(req);

  if (validationErrors.length > 0) {
    return res.status(400).json({
      errorsMessages: validationErrors.map((message) => ({
        message,
        field: "validation",
      })),
    });
  }

  const newVideo: VideoType = {
    id: Date.now(),
    title: req.body.title,
    author: req.body.author,
    canBeDownloaded: req.body.canBeDownloaded || false,
    minAgeRestriction: req.body.minAgeRestriction || null,
    createdAt: new Date().toISOString(),
    publicationDate: new Date(Date.now() + 86400000).toISOString(),
    availableResolutions: req.body.availableResolutions || [],
  };

  videos.push(newVideo);
  return res.status(201).json(newVideo);
});

app.put("/videos/:id", (req: Request, res: Response) => {
  const validationErrors = validateVideoInput(req);

  if (validationErrors.length > 0) {
    return res.status(400).json({
      errorsMessages: validationErrors.map((message) => ({
        message,
        field: "validation",
      })),
    });
  }

  const videoIndex = videos.findIndex((video) => video.id === +req.params.id);

  if (videoIndex !== -1) {
    videos.splice(videoIndex, 1, {
      ...videos[videoIndex],
      ...req.body,
    });

    return res.status(204).send();
  } else {
    return res.status(404).json({
      errorsMessages: [
        {
          message: "Video not found",
          field: "id",
        },
      ],
    });
  }
});

app.delete("/videos/:id", (req: Request, res: Response) => {
  const index = videos.findIndex((video) => video.id === +req.params.id);
  if (index !== -1) {
    videos.splice(index, 1);

    return res.send(204);
  } else {
    return res.send(404);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
