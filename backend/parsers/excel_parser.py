import pandas as pd


class ExcelParser:
    """
    Extracts text content from Excel and CSV files.
    Converts tabular data into readable text format.
    """

    def extract_text(self, file_path: str) -> str:
        """
        Extract all content from an Excel/CSV file.
        Each sheet is processed separately for Excel files.
        """

        if file_path.endswith('.csv'):
            return self._parse_csv(file_path)

        return self._parse_excel(file_path)

    def _parse_csv(self, file_path: str) -> str:
        """Parse a CSV file into text."""

        df = pd.read_csv(file_path)

        return self._dataframe_to_text(df, "CSV Data")

    def _parse_excel(self, file_path: str) -> str:
        """Parse an Excel file, processing all sheets."""

        excel_file = pd.ExcelFile(file_path)

        text_parts = []

        for sheet_name in excel_file.sheet_names:

            df = pd.read_excel(
                excel_file,
                sheet_name=sheet_name
            )

            sheet_text = self._dataframe_to_text(
                df,
                f"Sheet: {sheet_name}"
            )

            text_parts.append(sheet_text)

        return "\n\n".join(text_parts)

    def _dataframe_to_text(self, df: pd.DataFrame, title: str) -> str:
        """
        Convert a DataFrame into readable text.
        Each row becomes a line with column headers as labels.
        """

        if df.empty:
            return f"{title}\n(No data)"

        lines = [title, "-" * 40]

        columns = list(df.columns)

        for _, row in df.iterrows():

            row_parts = []

            for col in columns:

                value = row[col]

                # Skip NaN values
                if pd.isna(value):
                    continue

                row_parts.append(f"{col}: {value}")

            if row_parts:
                lines.append(" | ".join(row_parts))

        return "\n".join(lines)
