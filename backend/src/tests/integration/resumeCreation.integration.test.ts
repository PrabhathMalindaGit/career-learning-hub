import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { ResumeModel } from "../../modules/resumes/resume.model.js";
import { ResumeVersionModel } from "../../modules/resumes/resumeVersion.model.js";
import { registerTestUser } from "../helpers/auth.js";

const selectedContent = {
  basics: { fullName: "", links: [] },
  experience: [],
  education: [],
  skills: [
    {
      name: "Programming Languages",
      keywords: ["JavaScript", "TypeScript"],
    },
    { name: "Frontend", keywords: ["React", "Angular"] },
    { name: "Backend", keywords: ["Node.js", "Express"] },
    { name: "Databases", keywords: ["MongoDB"] },
  ],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
};

describe("Resume creation contract", () => {
  it("creates one canonical Resume and exactly one Version 1 with guided content", async () => {
    const owner = await registerTestUser(app, {
      email: "resume-create-guided@example.com",
      displayName: "Resume Create Guided",
    });

    const response = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ title: "Guided Resume", content: selectedContent })
      .expect(201);

    const resumes = await ResumeModel.find({ userId: owner.userId }).lean();
    const versions = await ResumeVersionModel.find({ userId: owner.userId }).lean();
    expect(resumes).toHaveLength(1);
    expect(versions).toHaveLength(1);
    expect(resumes[0]?.latestVersionNumber).toBe(1);
    expect(resumes[0]?.currentVersionId?.toString()).toBe(
      versions[0]?._id.toString(),
    );
    expect(versions[0]?.versionNumber).toBe(1);
    expect(versions[0]?.source).toBe("manual");
    expect(
      versions[0]?.content.skills.map(({ name, keywords }) => ({
        name,
        keywords,
      })),
    ).toEqual(selectedContent.skills);
    expect(response.body.data.version.versionNumber).toBe(1);
    expect(
      response.body.data.version.content.skills.map(
        ({ name, keywords }: { name: string; keywords: string[] }) => ({
          name,
          keywords,
        }),
      ),
    ).toEqual(selectedContent.skills);
  });

  it("preserves title-only blank Resume creation", async () => {
    const owner = await registerTestUser(app, {
      email: "resume-create-blank@example.com",
      displayName: "Resume Create Blank",
    });

    const response = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ title: "Blank Resume" })
      .expect(201);

    expect(response.body.data.version.content).toMatchObject({
      basics: { fullName: "", links: [] },
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      languages: [],
      interests: [],
    });
    expect(await ResumeModel.countDocuments({ userId: owner.userId })).toBe(1);
    expect(await ResumeVersionModel.countDocuments({ userId: owner.userId })).toBe(1);
  });

  it("rejects unknown content fields before persistence", async () => {
    const owner = await registerTestUser(app, {
      email: "resume-create-invalid@example.com",
      displayName: "Resume Create Invalid",
    });

    await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        title: "Invalid Resume",
        content: { ...selectedContent, inventedSection: [] },
      })
      .expect(400);

    expect(await ResumeModel.countDocuments({ userId: owner.userId })).toBe(0);
    expect(await ResumeVersionModel.countDocuments({ userId: owner.userId })).toBe(0);
  });
});
