from datetime import datetime
from typing import Optional, List
from fastapi import Depends
from sqlmodel import select
from .models import User, UserCreate, Video
from sqlmodel import SQLModel, create_engine, Session


sqlite_file_name = "data/database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=True, connect_args=connect_args)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


class DBClient:
    def __init__(self, session: Session):
        self.session = session

    # User Methods
    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.session.exec(select(User).where(User.email == email)).first()

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return self.session.get(User, user_id)

    def create_user(self, user: UserCreate, hashed_password: str) -> User:
        new_user = User.from_orm(user, update={"hashed_password": hashed_password})
        self.session.add(new_user)
        self.session.commit()
        self.session.refresh(new_user)
        return new_user

    # Video Methods
    def create_video(self, video: Video) -> Video:
        self.session.add(video)
        self.session.commit()
        self.session.refresh(video) 
        return video

    def get_video(self, video_id: str) -> Optional[Video]:
        return self.session.get(Video, video_id)

    def list_videos_by_owner(self, owner_id: int) -> List[Video]:
        statement = select(Video).where(Video.owner_id == owner_id).order_by(Video.updated_at.desc())
        return self.session.exec(statement).all()

    def delete_video(self, video: Video):
        self.session.delete(video)
        self.session.commit()

    def update_video_status(self, video_id: str, status: str, error: Optional[str] = None):
        video = self.session.get(Video, video_id)
        if video:
            video.status = status
            if error:
                video.error = error
            video.updated_at = datetime.utcnow()
            self.session.add(video)
            self.session.commit()
            self.session.refresh(video)
            return video
        return None
    
    def update_video(self, video: Video) -> Video:
        self.session.add(video)
        self.session.commit()
        self.session.refresh(video)
        return video

def get_db(session: Session = Depends(get_session)) -> DBClient:
    return DBClient(session)
