import argparse
import atexit
import json
import logging
import requests
import schedule
import time

from kafka import KafkaProducer
from kafka.errors import KafkaError, KafkaTimeoutError

logger_format = "%(asctime)s - %(message)s"
logging.basicConfig(format = logger_format)
logger = logging.getLogger('data-producer')
logger.setLevel(logging.DEBUG)

API_BASE = "https://api.gdax.com"


def fetch_price(symbol, producer, topic_name):
	"""
	 helper function to retrieve asset data and send it to kafka
	 :param symbol: the symbol of asset
	 :param producer: instance of a kafka producer
	 :return: None
	"""
	
	logger.debug('Start to fetch price for %s' % symbol)
	try:
		response = requests.get('%s/products/%s/ticker' %(API_BASE, symbol))

		price = response.json()['price']

		timestamp = time.time()
		payload = {'Symbol': str(symbol),
					'LastTradePrice': str(price),
					'LastTradeDateTime': str(timestamp)
		}
		logger.debug('Retrived %s info %s', symbol, payload)

		producer.send(topic = topic_name, value = json.dumps(payload).encode('utf-8'),
			timestamp_ms = int(time.time() * 1000))
		logger.debug('Sent price for %s to Kafka' %symbol)
	except Exception as e:
		logger.warn('Failed to fetch price: %s', (e))

def shutdown_hook(producer):
	"""
	a shutdown hook to be called before the shutdown
	:param producer: instance of a kafka producer
	:return: None
	"""
	try:
		logger.info('Flushing pending messages to kafka, timeout is set to 10s')
		producer.flush(10)
		logger.info('Finish flushing pending messages to kafka')
	except KafkaError as kafka_error:
		logger.warn('Failed to flush pending messages to kafka, caysed by: %s', kafka_error.message)

def check_symbol(symbol):
	"""
	 helper method to check if the symbol exists in coinbase API.
	"""
	logger.debug('Checking symbol.')
	try:
		response = requests.get(API_BASE + '/products')
		product_ids = [product['id'] for product in response.json()]
		if symbol not in product_ids:
			logger.warn('Symbol %s not supported. The list of supported symbols: %s', 
				symbol, product_ids)
			exit()
	except Exception as e:
		logger.warn('Failed to fetch products')





if __name__ == '__main__':
 	# Setup command line arguments
	parser = argparse.ArgumentParser()
	parser.add_argument('symbol', help = 'the symbol you want to pull')
	parser.add_argument('topic_name', help = 'the kafka topic push to')
	parser.add_argument('kafka_broker', help = 'the location of the kafka broker')


 	#Parse arguments
	args = parser.parse_args()
	symbol = args.symbol
	topic_name = args.topic_name
	kafka_broker = args.kafka_broker

 	# Check if the symbol is supported.
	check_symbol(symbol)

 	# Instantiate a simple kafka producer
	producer = KafkaProducer(
		bootstrap_servers=kafka_broker
	)

 	# Schedule and run the fetch_price function every second
	schedule.every(1).second.do(fetch_price, symbol, producer, topic_name)

 	# Setup proper shutdown hook
	atexit.register(shutdown_hook, producer)
	while True:
		schedule.run_pending()
		time.sleep(1)