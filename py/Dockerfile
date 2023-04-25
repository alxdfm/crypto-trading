FROM python:3.8
WORKDIR /app
COPY . /app
RUN pip install tradingview_ta ; pip install requests
CMD ["python", "main.py"]
EXPOSE 3000