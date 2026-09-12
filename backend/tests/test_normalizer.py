from app.schemas.cv import (
    ContactInfo,
    CvBullet,
    ExperienceEntry,
    EducationEntry,
    ProjectEntry,
    StructuredCv,
)
from app.services.document.normalizer import normalize_structured_cv


def test_normalize_structured_cv_assigns_ids():
    raw_cv = StructuredCv(
        contact=ContactInfo(name=" Jane Doe ", email="jane@example.com"),
        summary=" Experienced Engineer ",
        experience=[
            ExperienceEntry(
                id="",
                company=" TechCorp ",
                title=" Senior Developer ",
                dates=" 2021 - Present ",
                bullets=[
                    CvBullet(id="", text=" Built high-throughput microservices. "),
                    CvBullet(id="", text=" Reduced latency by 45%. "),
                ],
            )
        ],
        education=[
            EducationEntry(
                id="",
                institution=" Tech University ",
                degree=" B.S. Computer Science ",
                dates=" 2017 - 2021 ",
            )
        ],
        skills=[" Python ", " FastAPI ", " PostgreSQL "],
        projects=[
            ProjectEntry(
                id="",
                name=" Jomble ",
                description=" AI Job Tracker ",
                technologies=[" Next.js ", " Python "],
            )
        ],
    )

    normalized = normalize_structured_cv(raw_cv)

    # Experience & Bullets
    assert normalized.experience[0].id == "exp_1"
    assert normalized.experience[0].company == "TechCorp"
    assert normalized.experience[0].bullets[0].id == "b_1"
    assert normalized.experience[0].bullets[0].text == "Built high-throughput microservices."
    assert normalized.experience[0].bullets[1].id == "b_2"
    assert normalized.experience[0].bullets[1].text == "Reduced latency by 45%."

    # Education & Projects
    assert normalized.education[0].id == "edu_1"
    assert normalized.education[0].institution == "Tech University"
    assert normalized.projects[0].id == "proj_1"
    assert normalized.projects[0].name == "Jomble"

    # Skills & Contact
    assert normalized.skills == ["Python", "FastAPI", "PostgreSQL"]
    assert normalized.contact.name == "Jane Doe"
