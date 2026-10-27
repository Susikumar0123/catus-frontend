'use strict';
async function sellerOrderShipping(order){
 if(!order?.order_item_id)return notice('Order item is missing. Refresh Orders.');
 const status=order.seller_order_status||'new';
 if(['rejected','cancelled'].includes(status))return notice('This order cannot be shipped.');
 const shipments=[['delhivery',order.delhivery_shipment],['ekart',order.ekart_shipment]].filter(([,s])=>s&&!s.cancelled_at&&!['failed','cancelled'].includes(s.booking_state));
 if(shipments.length>1)return modal('Shipping needs review','<p>Multiple courier records exist for this order. Contact Cerood support before another booking.</p>');
 if(shipments.length){const [courier,s]=shipments[0];const tracking=s.waybill||s.awb||s.tracking_id||s.tracking_number;
  if(!tracking)return modal('Booking pending','<p>The existing courier booking is pending or uncertain. Check shipment history or contact Cerood support. Do not book the same parcel again.</p>');
  return orderShipping({order_id:order.order_id,order_item_id:order.order_item_id,fulfilment_location_id:order.fulfilment_location_id,courier,tracking_number:tracking,booking_state:s.booking_state});
 }
 if(['new','accepted'].includes(status)){
  const next=status==='new'?'accepted':'packed',label=status==='new'?'Accept this order':'Confirm item is packed';
  modal('Shipping · '+String(order.order_id),`<p><strong>${esc(order.product_name)}</strong> · ${esc(order.quantity)} item(s)</p><p>${status==='new'?'Accept this order first. After packing the actual product, mark it packed to book pickup.':'Pack the actual product, then confirm below. Next you can enter parcel details and choose your courier.'}</p><button class="btn primary" id="prepareOrderShipping">${label}</button>`);
  $('#prepareOrderShipping').onclick=e=>action(e.target,async()=>{await api.order(order.order_item_id,next);$('#dialog').close();notice(next==='packed'?'Item marked packed. Open Shipping beside this order to book pickup.':'Order accepted. Pack the item, then open Shipping again.');go('orders');});return;
 }
 if(!['packed','shipped'].includes(status))return modal('Shipping','<p>No active courier booking is attached to this order. Use Shipment history or contact Cerood support.</p>');
 return orderShipping({order_id:order.order_id,order_item_id:order.order_item_id,fulfilment_location_id:order.fulfilment_location_id});
}
