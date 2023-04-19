from tradingview_ta import TA_Handler, Interval
import time
import winsound
import requests

output = TA_Handler(symbol='BTCUSDT',
                    screener='Crypto',
                    exchange='Binance',
                    interval=Interval.INTERVAL_15_MINUTES)

url = 'http://localhost:3003/'

previousRSI = 0
currentRSI = 0


def hour():
    formatted = f"{time.localtime().tm_hour}:{time.localtime().tm_min}:{time.localtime().tm_sec}"
    print(formatted)


def neworder(operation):
    response = requests.get(url + operation)
    data = response.json()
    print(data)
    winsound.Beep(5000, 500)
    hour()


def currentandpreviousRSI(currentRSI, previousRSI):
    print("RSI Atual:", currentRSI)
    print("RSI Anterior:", previousRSI)


while 1 == 1:
    time.sleep(1)
    minute = time.localtime().tm_min
    second = time.localtime().tm_sec
    condition = (minute == 0 and second == 0) or (minute == 15 and second == 0) or \
                (minute == 30 and second == 0) or (minute == 45 and second == 0)
    if condition:
        rsi = output.get_analysis().indicators['RSI']
        if previousRSI == 0:
            previousRSI = rsi
        else:
            previousRSI = currentRSI
        currentRSI = rsi

        if previousRSI >= 70 and currentRSI < 70:
            print("RSI>=70")
            neworder('sell')
            print("RSI:", rsi)
            print('--------------------------------------')
        if previousRSI <= 30 and currentRSI > 30:
            print("RSI<=30")
            neworder('buy')
            print("RSI:", rsi)
            print('--------------------------------------')
        else:
            print("RSI ok")
            print("RSI:", rsi)
            hour()
            print('--------------------------------------')
        currentandpreviousRSI(currentRSI, previousRSI)
        print("===================================================")
