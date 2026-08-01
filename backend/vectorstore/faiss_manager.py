import os
import pickle

import faiss
import numpy as np


class FaissManager:

    def __init__(self):

        print("🔥 FaissManager Initialized")

        self.dimension = 768

        self.index_path = "backend/data/vector_store/faiss.index"

        self.metadata_path = "backend/data/vector_store/metadata.pkl"

        os.makedirs(
            "backend/data/vector_store",
            exist_ok=True
        )

        print("Vector Store Folder Ready ✓")

        if os.path.exists(self.index_path):

            print("Loading Existing FAISS Index")

            self.index = faiss.read_index(
                self.index_path
            )

        else:

            print("Creating New FAISS Index")

            self.index = faiss.IndexFlatL2(
                self.dimension
            )

        if os.path.exists(self.metadata_path):

            print("Loading Existing Metadata")

            with open(
                self.metadata_path,
                "rb"
            ) as f:

                self.metadata = pickle.load(f)

        else:

            print("Creating Empty Metadata")

            self.metadata = []

    def add_chunk(self, metadata, embedding):

        print("Adding Vector To FAISS...")

        vector = np.array(
            [embedding],
            dtype=np.float32
        )

        self.index.add(vector)

        self.metadata.append(metadata)

        print("Current Index Size :", self.index.ntotal)

        self.save()

    def save(self):

        print("Saving FAISS Index...")

        faiss.write_index(
            self.index,
            self.index_path
        )

        print("Saved :", self.index_path)

        with open(
            self.metadata_path,
            "wb"
        ) as f:

            pickle.dump(
                self.metadata,
                f
            )

        print("Saved :", self.metadata_path)

    def search(
        self,
        embedding,
        k=3
    ):

        print("\nSearching FAISS...")

        print("Current Index Size :", self.index.ntotal)

        if self.index.ntotal == 0:

            print("⚠ Index Empty")

            return []

        vector = np.array(
            [embedding],
            dtype=np.float32
        )

        distances, indices = self.index.search(
            vector,
            k
        )

        print("Indices :", indices)

        results = []

        for idx in indices[0]:

            if idx != -1:

                results.append(
                    self.metadata[idx]
                )

        print("Results Found :", len(results))

        return results