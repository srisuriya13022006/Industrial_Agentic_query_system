import os
import shutil
from fastapi import UploadFile

UPLOAD_FOLDER = "sample_data/uploads"


class DocumentService:

    def save_file(self, file: UploadFile):

        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        file_path = os.path.join(
            UPLOAD_FOLDER,
            file.filename
        )

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return file_path