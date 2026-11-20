from prefect.schedules import Cron

from flow_etl import etl_fiscalize


# Created by AI.
SCHEDULE_CRON = "0 3 * * *"

# Created by AI.
SCHEDULE_TIMEZONE = "America/Recife"


# Created by AI.
def main() -> None:
    etl_fiscalize.serve(
        name="etl-fiscalize-diaria",
        schedule=Cron(
            SCHEDULE_CRON,
            timezone=SCHEDULE_TIMEZONE,
        ),
    )


# Created by AI.
if __name__ == "__main__":
    main()
